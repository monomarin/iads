import { FastifyInstance } from "fastify";
import { db, syncLogs, syncSchedule, stores } from "@raemonorepo/db";
import { eq, desc, and } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";
import { addSyncJob } from "../services/sync-queue";

export async function syncRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/sync/status", async (request, reply) => {
    const storeId = (request.query as { storeId?: string }).storeId;
    if (!storeId) return reply.status(400).send({ error: "storeId required" });

    const lastSync = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.storeId, storeId as string))
      .orderBy(desc(syncLogs.createdAt))
      .limit(1);

    return { lastSync: lastSync[0] ?? null };
  });

  app.post("/api/sync/trigger", async (request, reply) => {
    const { storeId } = request.body as { storeId: string };
    if (!storeId) return reply.status(400).send({ error: "storeId required" });

    const store = await db.select().from(stores).where(eq(stores.id, storeId as string)).limit(1);
    if (!store[0]) return reply.status(404).send({ error: "Store not found" });

    const job = await addSyncJob(storeId, "manual");
    return { message: "Sync triggered", jobId: job.id };
  });

  app.get("/api/sync/logs", async (request, _reply) => {
    const query = request.query as { storeId?: string; limit?: string };
    const storeId = query.storeId;
    const limit = Math.min(parseInt(query.limit ?? "50", 10), 200);

    let result;
    if (storeId) {
      result = await db
        .select()
        .from(syncLogs)
        .where(eq(syncLogs.storeId, storeId as string))
        .orderBy(desc(syncLogs.createdAt))
        .limit(limit);
    } else {
      result = await db
        .select()
        .from(syncLogs)
        .orderBy(desc(syncLogs.createdAt))
        .limit(limit);
    }
    return { logs: result };
  });

  app.get("/api/sync/schedule", async (request, _reply) => {
    const query = request.query as { storeId?: string };
    const storeId = query.storeId;

    let result;
    if (storeId) {
      result = await db
        .select()
        .from(syncSchedule)
        .where(and(eq(syncSchedule.storeId, storeId as string), eq(syncSchedule.overrideGlobal, true)))
        .limit(1);
      if (result[0]) return { schedule: result[0], overridden: true };
    }

    const globalSchedule = await db
      .select()
      .from(syncSchedule)
      .where(eq(syncSchedule.storeId, "00000000-0000-0000-0000-000000000000" as any))
      .limit(1);
    return { schedule: globalSchedule[0] ?? null, overridden: false };
  });

  app.put("/api/sync/schedule", async (request, reply) => {
    const body = request.body as {
      storeId?: string;
      cronExpression: string;
      timezone?: string;
      isActive?: boolean;
      overrideGlobal?: boolean;
    };
    if (!body.cronExpression) return reply.status(400).send({ error: "cronExpression required" });

    const scheduleId = body.storeId ?? "00000000-0000-0000-0000-000000000000";

    const existing = await db
      .select()
      .from(syncSchedule)
      .where(eq(syncSchedule.storeId, scheduleId as string))
      .limit(1);

    if (existing[0]) {
      const updated = await db
        .update(syncSchedule)
        .set({
          cronExpression: body.cronExpression,
          timezone: body.timezone ?? existing[0].timezone,
          isActive: body.isActive ?? existing[0].isActive,
          overrideGlobal: body.overrideGlobal ?? existing[0].overrideGlobal,
          updatedAt: new Date(),
        })
        .where(eq(syncSchedule.id, existing[0].id))
        .returning();
      return { schedule: updated[0] };
    }

    const created = await db
      .insert(syncSchedule)
      .values({
        storeId: scheduleId as string,
        cronExpression: body.cronExpression,
        timezone: body.timezone ?? "UTC",
        isActive: body.isActive ?? true,
        overrideGlobal: body.overrideGlobal ?? false,
      })
      .returning();
    return { schedule: created[0] };
  });
}
