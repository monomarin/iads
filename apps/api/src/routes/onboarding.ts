import { FastifyInstance } from "fastify";
import { db, users, onboardingProgress } from "@raemonorepo/db";
import { eq } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function onboardingRoutes(app: FastifyInstance) {
  app.addHook("onRequest", tenantMiddleware);

  app.get("/api/onboarding/progress", async (request, reply) => {
    const userDb = await db.select()
      .from(users)
      .where(eq(users.clerkId, request.userId!))
      .limit(1);

    if (!userDb[0]) {
      return reply.status(404).send({ error: "User not found" });
    }

    const progress = await db.select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userDb[0].id))
      .limit(1);

    if (!progress[0]) {
      return reply.send({ step: 1, completed: false, data: {} });
    }

    return reply.send(progress[0]);
  });

  app.put("/api/onboarding/progress", async (request, reply) => {
    const body = request.body as {
      step?: number;
      completed?: boolean;
      data?: Record<string, unknown>;
    };

    const userDb = await db.select()
      .from(users)
      .where(eq(users.clerkId, request.userId!))
      .limit(1);

    if (!userDb[0]) {
      return reply.status(404).send({ error: "User not found" });
    }

    const existing = await db.select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userDb[0].id))
      .limit(1);

    if (existing[0]) {
      const mergedData = body.data
        ? { ...(existing[0].data as Record<string, unknown>), ...body.data }
        : existing[0].data;

      const updated = await db.update(onboardingProgress)
        .set({
          step: body.step ?? existing[0].step,
          completed: body.completed ?? existing[0].completed,
          data: mergedData,
          updatedAt: new Date(),
        })
        .where(eq(onboardingProgress.id, existing[0].id))
        .returning();
      return reply.send(updated[0]);
    }

    const created = await db.insert(onboardingProgress)
      .values({
        userId: userDb[0].id,
        step: body.step || 1,
        completed: body.completed || false,
        data: body.data || {},
      })
      .returning();
    return reply.status(201).send(created[0]);
  });

  app.post("/api/onboarding/complete", async (request, reply) => {
    const userDb = await db.select()
      .from(users)
      .where(eq(users.clerkId, request.userId!))
      .limit(1);

    if (!userDb[0]) {
      return reply.status(404).send({ error: "User not found" });
    }

    const updated = await db.update(onboardingProgress)
      .set({ completed: true, step: 0, updatedAt: new Date() })
      .where(eq(onboardingProgress.userId, userDb[0].id))
      .returning();
    return reply.send(updated[0]);
  });
}
