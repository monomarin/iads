import { FastifyInstance } from "fastify";
import { db, brandSafetyLogs, brandSafetyRules, audioVariants, campaigns } from "@raemonorepo/db";
import { eq, desc, and } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";
import { runBrandSafetyCheck } from "../services/brand-safety";

export async function brandSafetyRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/brand-safety/logs", async (request, _reply) => {
    const tenantId = request.tenantId!;
    const result = await db
      .select()
      .from(brandSafetyLogs)
      .innerJoin(audioVariants, eq(brandSafetyLogs.variantId, audioVariants.id))
      .innerJoin(campaigns, eq(audioVariants.campaignId, campaigns.id))
      .where(eq(campaigns.tenantId, tenantId as string))
      .orderBy(desc(brandSafetyLogs.createdAt))
      .limit(50);
    return { logs: result };
  });

  app.post("/api/brand-safety/check", async (request, reply) => {
    const { variantId } = request.body as { variantId: string };
    if (!variantId) return reply.status(400).send({ error: "variantId required" });

    const variant = await db
      .select()
      .from(audioVariants)
      .where(eq(audioVariants.id, variantId as string))
      .limit(1);
    if (!variant[0]) return reply.status(404).send({ error: "Variant not found" });

    const result = await runBrandSafetyCheck(
      variantId,
      variant[0].script ?? "",
    );

    const log = await db
      .insert(brandSafetyLogs)
      .values({
        variantId,
        status: result.passed ? "passed" : "flagged",
        score: result.score,
        layers: result.layers as any,
        summary: result.summary,
      })
      .returning();

    if (!result.passed) {
      await db
        .update(audioVariants)
        .set({ role: (variant[0].role + "_flagged") as any, updatedAt: new Date() })
        .where(eq(audioVariants.id, variantId as string));
    }

    return { log: log[0], result };
  });

  app.get("/api/brand-safety/rules", async (request, _reply) => {
    const tenantId = request.tenantId!;
    const rules = await db
      .select()
      .from(brandSafetyRules)
      .where(eq(brandSafetyRules.tenantId, tenantId as string));
    return { rules };
  });

  app.put("/api/brand-safety/rules", async (request, reply) => {
    const tenantId = request.tenantId!;
    const body = request.body as { country: string; rules: string[] };
    if (!body.country || !body.rules) return reply.status(400).send({ error: "country and rules required" });

    const existing = await db
      .select()
      .from(brandSafetyRules)
      .where(and(eq(brandSafetyRules.tenantId, tenantId as string), eq(brandSafetyRules.country, body.country)))
      .limit(1);

    if (existing[0]) {
      const updated = await db
        .update(brandSafetyRules)
        .set({ rules: body.rules as any, updatedAt: new Date() })
        .where(eq(brandSafetyRules.id, existing[0].id))
        .returning();
      return { rule: updated[0] };
    }

    const created = await db
      .insert(brandSafetyRules)
      .values({ tenantId: tenantId as string, country: body.country, rules: body.rules as any })
      .returning();
    return { rule: created[0] };
  });
}
