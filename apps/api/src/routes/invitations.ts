import { FastifyInstance } from "fastify";
import { db, users, tenantInvitations } from "@raemonorepo/db";
import { eq } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function invitationRoutes(app: FastifyInstance) {
  app.addHook("onRequest", tenantMiddleware);

  app.post("/api/invitations", async (request, reply) => {
    const body = request.body as { email: string; role?: string };
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await db.insert(tenantInvitations).values({
      tenantId: request.tenantId!,
      email: body.email,
      role: body.role || "store_admin",
      token,
      expiresAt,
    }).returning();

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@rae.app",
          to: body.email,
          subject: "You've been invited to Retail Audio Engine",
          html: `<p>Click <a href="${process.env.NEXT_PUBLIC_APP_URL}/invitations/accept?token=${token}">here</a> to accept your invitation.</p>`,
        }),
      });
    } catch {
      app.log.warn("Failed to send invitation email");
    }

    return reply.status(201).send(invitation[0]);
  });

  app.post("/api/invitations/accept", async (request, reply) => {
    const body = request.body as { token: string };
    const invitation = await db.select()
      .from(tenantInvitations)
      .where(eq(tenantInvitations.token, body.token))
      .limit(1);

    const inv = invitation[0];
    if (!inv) {
      return reply.status(404).send({ error: "Invalid token" });
    }

    if (inv.acceptedAt) {
      return reply.status(400).send({ error: "Invitation already accepted" });
    }

    if (new Date() > inv.expiresAt) {
      return reply.status(400).send({ error: "Invitation expired" });
    }

    await db.update(tenantInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(tenantInvitations.id, inv.id));

    await db.update(users)
      .set({
        tenantId: inv.tenantId,
        role: inv.role,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, request.userId!));

    return reply.send({ success: true, tenantId: inv.tenantId });
  });

  app.get("/api/invitations/:token", async (request, reply) => {
    const { token } = request.params as { token: string };
    const invitation = await db.select()
      .from(tenantInvitations)
      .where(eq(tenantInvitations.token, token))
      .limit(1);

    const inv = invitation[0];
    if (!inv) {
      return reply.status(404).send({ error: "Invalid token" });
    }

    return reply.send({
      email: inv.email,
      expired: new Date() > inv.expiresAt,
      accepted: !!inv.acceptedAt,
    });
  });
}
