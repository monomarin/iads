import { FastifyInstance } from "fastify";
import { db, tenants, campaigns, audioCatalog } from "@raemonorepo/db";
import { eq } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function demoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/tenants/demo-status", async (request, reply) => {
    const tenantId = request.tenantId!;
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId as string))
      .limit(1);
    if (!tenant[0]) return reply.status(404).send({ error: "Tenant not found" });
    return { isDemo: tenant[0].isDemo ?? false };
  });

  app.post("/api/tenants/demo/go-production", async (request, reply) => {
    const tenantId = request.tenantId!;
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId as string))
      .limit(1);
    if (!tenant[0]) return reply.status(404).send({ error: "Tenant not found" });
    if (!tenant[0].isDemo) return reply.status(400).send({ error: "Already in production mode" });

    await db.delete(campaigns).where(eq(campaigns.tenantId, tenantId as string));
    await db.delete(audioCatalog).where(eq(audioCatalog.tenantId, tenantId as string));

    await db
      .update(tenants)
      .set({ isDemo: false, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId as string));

    return { message: "Demo data cleaned. Switched to production mode." };
  });
}
