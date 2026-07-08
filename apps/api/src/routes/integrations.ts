import { FastifyInstance } from "fastify";
import { db, integrations, integrationLogs } from "@raemonorepo/db";
import { eq, desc, and } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

const PROVIDERS = [
  { id: "slack", name: "Slack", description: "Receive notifications in Slack channels", icon: "💬", docs: "https://api.slack.com/" },
  { id: "discord", name: "Discord", description: "Send alerts to Discord channels via webhook", icon: "🔔", docs: "https://discord.com/developers/docs" },
  { id: "google_analytics", name: "Google Analytics", description: "Track audio plays as GA4 events", icon: "📊", docs: "https://developers.google.com/analytics" },
  { id: "resend", name: "Resend", description: "Transactional emails for invoices and alerts", icon: "📧", docs: "https://resend.com/docs" },
  { id: "stripe", name: "Stripe", description: "Payment processing and subscription management", icon: "💳", docs: "https://stripe.com/docs" },
  { id: "zapier", name: "Zapier", description: "Connect with 5000+ apps via webhooks", icon: "⚡", docs: "https://zapier.com/" },
] as const;

export async function integrationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/integrations", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };

    const existing = await db
      .select()
      .from(integrations)
      .where(eq(integrations.tenantId, tenantId as string));

    const enriched = PROVIDERS.map((p) => {
      const installed = existing.find((e) => e.provider === p.id);
      return {
        ...p,
        installed: !!installed,
        integration: installed ?? null,
      };
    });

    return { integrations: enriched };
  });

  app.post("/api/integrations/:provider/connect", async (request, reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const { provider } = request.params as { provider: string };
    const body = request.body as Record<string, unknown>;

    const providerMeta = PROVIDERS.find((p) => p.id === provider);
    if (!providerMeta) return reply.status(404).send({ error: `Provider '${provider}' not supported` });

    const existing = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.tenantId, tenantId as string),
          eq(integrations.provider, provider)
        )
      )
      .limit(1);

    let integration;
    if (existing[0]) {
      const updated = await db
        .update(integrations)
        .set({ config: body as any, isEnabled: true, updatedAt: new Date() })
        .where(eq(integrations.id, existing[0].id))
        .returning();
      integration = updated[0];
    } else {
      const created = await db
        .insert(integrations)
        .values({
          tenantId: tenantId as string,
          provider,
          label: providerMeta.name,
          config: body as any,
          isEnabled: true,
        })
        .returning();
      integration = created[0];
    }

    await db.insert(integrationLogs).values({
      integrationId: integration!.id,
      event: "connected",
      status: "success",
      message: `Connected to ${providerMeta.name}`,
    });

    return { integration, success: true };
  });

  app.post("/api/integrations/:id/disconnect", async (request, reply) => {
    const { id } = request.params as { id: string };

    const updated = await db
      .update(integrations)
      .set({ isEnabled: false, updatedAt: new Date() })
      .where(eq(integrations.id, id as string))
      .returning();
    if (!updated[0]) return reply.status(404).send({ error: "Integration not found" });

    await db.insert(integrationLogs).values({
      integrationId: id as string,
      event: "disconnected",
      status: "success",
      message: "Integration disconnected",
    });

    return { success: true };
  });

  app.put("/api/integrations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { config?: Record<string, unknown>; isEnabled?: boolean; label?: string };

    const updated = await db
      .update(integrations)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(integrations.id, id as string))
      .returning();
    if (!updated[0]) return reply.status(404).send({ error: "Integration not found" });
    return { integration: updated[0] };
  });

  app.get("/api/integrations/:id/logs", async (request, reply) => {
    const { id } = request.params as { id: string };

    const integration = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, id as string))
      .limit(1);
    if (!integration[0]) return reply.status(404).send({ error: "Integration not found" });

    const logs = await db
      .select()
      .from(integrationLogs)
      .where(eq(integrationLogs.integrationId, id as string))
      .orderBy(desc(integrationLogs.createdAt))
      .limit(20);

    return { logs };
  });
}
