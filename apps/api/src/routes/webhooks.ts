import { FastifyInstance } from "fastify";
import { Webhook } from "svix";
import { db, tenants, users } from "@raemonorepo/db";
import { eq } from "drizzle-orm";

interface ClerkWebhookPayload {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    first_name?: string;
    last_name?: string;
    public_metadata?: Record<string, unknown>;
    private_metadata?: Record<string, unknown>;
  };
}

function generateId(): string {
  return crypto.randomUUID();
}

export async function webhookRoutes(app: FastifyInstance) {
  app.post("/api/webhooks/clerk", async (request, reply) => {
    const svixId = request.headers["svix-id"] as string;
    const svixTimestamp = request.headers["svix-timestamp"] as string;
    const svixSignature = request.headers["svix-signature"] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return reply.status(400).send({ error: "Missing svix headers" });
    }

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");
    const payload = request.body as ClerkWebhookPayload;

    try {
      wh.verify(JSON.stringify(payload), {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return reply.status(400).send({ error: "Invalid webhook signature" });
    }

    switch (payload.type) {
      case "user.created": {
        const { id, email_addresses, public_metadata } = payload.data;
        const email = email_addresses?.[0]?.email_address || "";
        const tenantId = (public_metadata?.tenant_id as string) || generateId();
        const role = (public_metadata?.role as string) || "store_admin";

        const existingTenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
        if (existingTenant.length === 0) {
          await db.insert(tenants).values({
            id: tenantId,
            name: email.split("@")[0] + "'s Store",
            slug: email.split("@")[0] || "new-store",
          });
        }

        await db.insert(users).values({
          clerkId: id,
          tenantId,
          email,
          role,
        });

        await fetch(`https://api.clerk.com/v1/users/${id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            public_metadata: { tenant_id: tenantId, role },
          }),
        });

        break;
      }

      case "user.updated": {
        const { id, public_metadata } = payload.data;
        const role = (public_metadata?.role as string) || "store_admin";
        await db.update(users)
          .set({ role, updatedAt: new Date() })
          .where(eq(users.clerkId, id));
        break;
      }

      case "user.deleted": {
        const { id } = payload.data;
        await db.delete(users).where(eq(users.clerkId, id));
        break;
      }
    }

    return reply.status(200).send({ success: true });
  });
}
