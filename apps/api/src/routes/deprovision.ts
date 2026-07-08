import { FastifyInstance } from "fastify";
import { db, tenants } from "@raemonorepo/db";
import { eq, sql } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function deprovisionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/tenants/deprovision-status", async (request, reply) => {
    const tenantId = request.tenantId!;
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId as string))
      .limit(1);
    if (!tenant[0]) return reply.status(404).send({ error: "Tenant not found" });

    const t = tenant[0];
    const step = t.deprovisionStep ?? "active";
    const suspendedAt = t.suspendedAt;
    const deletionScheduledAt = t.deletionScheduledAt;

    let daysRemaining = 37;
    if (suspendedAt) {
      const elapsed = Math.floor((Date.now() - new Date(suspendedAt).getTime()) / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, 37 - elapsed);
    }

    return {
      step,
      suspendedAt: suspendedAt?.toISOString() ?? null,
      deletionScheduledAt: deletionScheduledAt?.toISOString() ?? null,
      daysRemaining,
      canReactivate: step === "suspended" || step === "grace",
    };
  });

  app.post("/api/tenants/suspend", async (request, _reply) => {
    const tenantId = request.tenantId!;
    const now = new Date();

    const updated = await db
      .update(tenants)
      .set({
        suspendedAt: now,
        deprovisionStep: "suspended",
        deprovisionNotifiedAt: now,
        updatedAt: now,
      })
      .where(eq(tenants.id, tenantId as string))
      .returning();
    return { tenant: updated[0], message: "Tenant suspended. Data will be deleted in 37 days." };
  });

  app.post("/api/tenants/reactivate", async (request, reply) => {
    const tenantId = request.tenantId!;

    const existing = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId as string))
      .limit(1);
    if (!existing[0]) return reply.status(404).send({ error: "Tenant not found" });

    const step = existing[0].deprovisionStep;
    if (step !== "suspended" && step !== "grace") {
      return reply.status(400).send({ error: "Can only reactivate from suspended or grace state" });
    }

    const updated = await db
      .update(tenants)
      .set({
        suspendedAt: null,
        deletionScheduledAt: null,
        deprovisionStep: "active",
        deprovisionNotifiedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId as string))
      .returning();
    return { tenant: updated[0], message: "Tenant reactivated successfully" };
  });

  app.get("/api/admin/deprovision-queue", async (request, reply) => {
    if (request.userRole !== "super_admin") {
      return reply.status(403).send({ error: "Forbidden: Super Admin access required" });
    }

    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        deprovisionStep: tenants.deprovisionStep,
        suspendedAt: tenants.suspendedAt,
        deletionScheduledAt: tenants.deletionScheduledAt,
      })
      .from(tenants)
      .where(sql`${tenants.deprovisionStep} != 'active'`)
      .orderBy(tenants.suspendedAt);

    return { queue: allTenants };
  });
}
