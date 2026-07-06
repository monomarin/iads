import { FastifyInstance } from "fastify";
import { db, backupConfig, backupLogs } from "@raemonorepo/db";
import { eq, desc } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function backupRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/backups/config", async (request, _reply) => {
    const tenantId = request.tenantId!;
    let config = await db
      .select()
      .from(backupConfig)
      .where(eq(backupConfig.tenantId, tenantId as string))
      .limit(1);
    if (!config[0]) {
      const created = await db
        .insert(backupConfig)
        .values({ tenantId: tenantId as string })
        .returning();
      config = created;
    }
    return { config: config[0] };
  });

  app.put("/api/backups/config", async (request, reply) => {
    const tenantId = request.tenantId!;
    const body = request.body as { retentionDays?: number; frequency?: string; time?: string };
    const existing = await db
      .select()
      .from(backupConfig)
      .where(eq(backupConfig.tenantId, tenantId as string))
      .limit(1);
    if (!existing[0]) return reply.status(404).send({ error: "No config found" });
    const updated = await db
      .update(backupConfig)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(backupConfig.id, existing[0].id))
      .returning();
    return { config: updated[0] };
  });

  app.get("/api/backups/logs", async (request, _reply) => {
    const tenantId = request.tenantId!;
    const logs = await db
      .select()
      .from(backupLogs)
      .where(eq(backupLogs.tenantId, tenantId as string))
      .orderBy(desc(backupLogs.startedAt))
      .limit(20);
    return { logs };
  });
}
