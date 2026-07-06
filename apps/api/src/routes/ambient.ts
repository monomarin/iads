import { FastifyInstance } from "fastify";
import { db, edgeNodes } from "@raemonorepo/db";
import { eq } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function ambientRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/edge-nodes/:id/ambient-config", async (request, reply) => {
    const { id } = request.params as { id: string };
    const node = await db.select().from(edgeNodes).where(eq(edgeNodes.id, id as string)).limit(1);
    if (!node[0]) return reply.status(404).send({ error: "Edge node not found" });
    const settings = (node[0].settings ?? {}) as Record<string, unknown>;
    return {
      config: {
        enabled: settings.ambientEnabled ?? true,
        thresholds: settings.ambientThresholds ?? [40, 65],
        nightCap: settings.ambientNightCap ?? 50,
        manualOverrideUntil: settings.ambientManualOverrideUntil ?? null,
      },
    };
  });

  app.put("/api/edge-nodes/:id/ambient-config", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      enabled?: boolean;
      thresholds?: [number, number];
      nightCap?: number;
    };
    const node = await db.select().from(edgeNodes).where(eq(edgeNodes.id, id as string)).limit(1);
    if (!node[0]) return reply.status(404).send({ error: "Edge node not found" });

    const settings = { ...(node[0].settings as Record<string, unknown>) };
    if (body.enabled !== undefined) settings.ambientEnabled = body.enabled;
    if (body.thresholds) settings.ambientThresholds = body.thresholds;
    if (body.nightCap !== undefined) settings.ambientNightCap = body.nightCap;

    const updated = await db
      .update(edgeNodes)
      .set({ settings: settings as any, updatedAt: new Date() })
      .where(eq(edgeNodes.id, id as string))
      .returning();
    return { config: updated[0]?.settings ?? settings };
  });

  app.post("/api/edge-nodes/:id/ambient-telemetry", async (_request, _reply) => {
    return { message: "Telemetry received" };
  });
}
