import { FastifyInstance } from "fastify";
import { db, audioAuditLogs, campaigns, audioVariants } from "@raemonorepo/db";
import { eq, desc, and } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function audioAuditRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/audio-audit", async (request, _reply) => {
    const tenantId = request.tenantId!;
    const result = await db
      .select()
      .from(audioAuditLogs)
      .innerJoin(campaigns, eq(audioAuditLogs.campaignId, campaigns.id))
      .where(eq(campaigns.tenantId, tenantId as string))
      .orderBy(desc(audioAuditLogs.checkedAt))
      .limit(50);
    return { audits: result };
  });

  app.post("/api/audio-audit/check", async (request, reply) => {
    const tenantId = request.tenantId!;
    const { campaignId } = request.body as { campaignId: string };

    const campaign = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId as string), eq(campaigns.tenantId, tenantId as string)))
      .limit(1);
    if (!campaign[0]) return reply.status(404).send({ error: "Campaign not found" });

    const variants = await db
      .select()
      .from(audioVariants)
      .where(eq(audioVariants.campaignId, campaignId as string));

    const issues: Array<{ variantId: string; issue: string }> = [];
    for (const v of variants) {
      if (!v.audioUrl) issues.push({ variantId: v.id, issue: "Missing audio file" });
      if (!v.script) issues.push({ variantId: v.id, issue: "Missing script" });
    }

    const log = await db
      .insert(audioAuditLogs)
      .values({
        campaignId,
        checkType: "pre_campaign",
        playCount: 0,
        status: issues.length === 0 ? "passed" : "failed",
        issues: issues as any,
      })
      .returning();
    return { audit: log[0] };
  });
}
