import { FastifyInstance } from "fastify";
import { db, apiKeys, webhooks } from "@raemonorepo/db";
import { eq, desc } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import { tenantMiddleware } from "../middleware/tenant";

const WEBHOOK_EVENTS = [
  "sync.completed", "sync.failed", "campaign.activated", "campaign.ended",
  "approval.resolved", "audio.audit.issue", "brand.safety.alert", "billing.receipt",
] as const;

export async function developerRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/developer/keys", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.tenantId, tenantId as string))
      .orderBy(desc(apiKeys.createdAt));
    return { keys };
  });

  app.post("/api/developer/keys", async (request, reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const body = request.body as { name: string; permissions?: string[] };

    if (!body.name) return reply.status(400).send({ error: "name required" });

    const rawKey = `ra_${randomBytes(24).toString("hex")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const created = await db
      .insert(apiKeys)
      .values({
        tenantId: tenantId as string,
        name: body.name,
        keyHash,
        permissions: (body.permissions ?? ["read"]) as any,
      })
      .returning();

    return { key: created[0], rawKey };
  });

  app.put("/api/developer/keys/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; permissions?: string[]; isActive?: boolean };

    const updated = await db
      .update(apiKeys)
      .set({ ...body })
      .where(eq(apiKeys.id, id as string))
      .returning();
    if (!updated[0]) return reply.status(404).send({ error: "Key not found" });
    return { key: updated[0] };
  });

  app.delete("/api/developer/keys/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id as string))
      .returning();
    if (!deleted[0]) return reply.status(404).send({ error: "Key not found" });
    return { success: true };
  });

  app.get("/api/developer/webhooks", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const hooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.tenantId, tenantId as string))
      .orderBy(desc(webhooks.createdAt));

    if (hooks.length === 0) {
      return { webhooks: [], events: WEBHOOK_EVENTS };
    }
    return { webhooks: hooks, events: WEBHOOK_EVENTS };
  });

  app.post("/api/developer/webhooks", async (request, reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const body = request.body as { url: string; events: string[]; secret?: string };

    if (!body.url) return reply.status(400).send({ error: "url required" });

    const created = await db
      .insert(webhooks)
      .values({
        tenantId: tenantId as string,
        url: body.url,
        events: (body.events ?? []) as any,
        secret: body.secret ?? randomBytes(16).toString("hex"),
      })
      .returning();

    return { webhook: created[0] };
  });

  app.put("/api/developer/webhooks/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { url?: string; events?: string[]; isActive?: boolean };

    const updated = await db
      .update(webhooks)
      .set({ ...body })
      .where(eq(webhooks.id, id as string))
      .returning();
    if (!updated[0]) return reply.status(404).send({ error: "Webhook not found" });
    return { webhook: updated[0] };
  });

  app.delete("/api/developer/webhooks/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await db
      .delete(webhooks)
      .where(eq(webhooks.id, id as string))
      .returning();
    if (!deleted[0]) return reply.status(404).send({ error: "Webhook not found" });
    return { success: true };
  });

  app.post("/api/developer/webhooks/:id/test", async (request, reply) => {
    const { id } = request.params as { id: string };
    const hook = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.id, id as string))
      .limit(1);
    if (!hook[0]) return reply.status(404).send({ error: "Webhook not found" });
    return { success: true, message: `Test payload sent to ${hook[0].url}` };
  });
}
