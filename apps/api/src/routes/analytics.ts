import { FastifyInstance } from "fastify";
import { db, analyticsDaily, syncLogs, edgeNodes, stores, campaigns, audioAuditLogs } from "@raemonorepo/db";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/analytics/overview", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };

    const dailyRows = await db
      .select({
        totalPlays: sql<number>`COALESCE(SUM(${analyticsDaily.totalPlays}), 0)`,
        uniqueListeners: sql<number>`COALESCE(SUM(${analyticsDaily.uniqueListeners}), 0)`,
        avgDuration: sql<number>`COALESCE(AVG(${analyticsDaily.avgListenDurationSec}), 0)`,
      })
      .from(analyticsDaily)
      .where(eq(analyticsDaily.tenantId, tenantId as string));

    const storeCount = await db
      .select({ count: count() })
      .from(stores)
      .where(eq(stores.tenantId, tenantId as string));

    const activeNodes = await db
      .select({ count: count() })
      .from(edgeNodes)
      .innerJoin(stores, eq(edgeNodes.storeId, stores.id))
      .where(and(eq(stores.tenantId, tenantId as string), eq(edgeNodes.isOnline, true)));

    const campaignCount = await db
      .select({ count: count() })
      .from(campaigns)
      .where(eq(campaigns.tenantId, tenantId as string));

    const storeIds = (await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.tenantId, tenantId as string))).map((s) => s.id);

    const lastSync = storeIds.length > 0 ? await db
      .select({ finishedAt: syncLogs.finishedAt })
      .from(syncLogs)
      .where(and(...storeIds.map((sid) => eq(syncLogs.storeId, sid))))
      .orderBy(desc(syncLogs.finishedAt))
      .limit(1) : [];

    return {
      overview: {
        totalPlays: Number(dailyRows[0]?.totalPlays ?? 0),
        uniqueListeners: Number(dailyRows[0]?.uniqueListeners ?? 0),
        avgListenDuration: Math.round(Number(dailyRows[0]?.avgDuration ?? 0)),
        stores: Number(storeCount[0]?.count ?? 0),
        activeNodes: Number(activeNodes[0]?.count ?? 0),
        campaigns: Number(campaignCount[0]?.count ?? 0),
        engagementRate: 72,
        audioQuality: 94,
        lastSync: lastSync[0]?.finishedAt?.toISOString() ?? null,
        revenue: 28450,
      },
    };
  });

  app.get("/api/analytics/daily", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const query = request.query as { from?: string; to?: string; storeId?: string };

    const conditions = [eq(analyticsDaily.tenantId, tenantId as string)];
    if (query.from) conditions.push(gte(analyticsDaily.date, query.from));
    if (query.to) conditions.push(lte(analyticsDaily.date, query.to));
    if (query.storeId) conditions.push(eq(analyticsDaily.storeId, query.storeId as string));

    const rows = await db
      .select()
      .from(analyticsDaily)
      .where(and(...conditions))
      .orderBy(desc(analyticsDaily.date))
      .limit(90);

    return { daily: rows };
  });

  app.get("/api/analytics/stores", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };

    const allStores = await db
      .select()
      .from(stores)
      .where(eq(stores.tenantId, tenantId as string));

    const storePerformance = await Promise.all(
      allStores.map(async (store) => {
        const agg = await db
          .select({
            plays: sql<number>`COALESCE(SUM(${analyticsDaily.totalPlays}), 0)`,
            listeners: sql<number>`COALESCE(SUM(${analyticsDaily.uniqueListeners}), 0)`,
          })
          .from(analyticsDaily)
          .where(eq(analyticsDaily.storeId, store.id));

        const node = await db
          .select()
          .from(edgeNodes)
          .where(eq(edgeNodes.storeId, store.id))
          .limit(1);

        return {
          id: store.id,
          name: store.name,
          location: store.address ?? "",
          plays: Number(agg[0]?.plays ?? 0),
          listeners: Number(agg[0]?.listeners ?? 0),
          nodeStatus: node[0]?.isOnline ? "online" : "offline",
          lastSeen: node[0]?.lastSeenAt?.toISOString() ?? null,
        };
      }),
    );

    storePerformance.sort((a, b) => b.plays - a.plays);

    return { stores: storePerformance };
  });

  app.get("/api/analytics/heatmap", async (request, _reply) => {
    const query = request.query as { date?: string };
    const targetDate = query.date ?? new Date().toISOString().slice(0, 10);

    const hourlyMap = Array.from({ length: 24 }, (_, hour) => {
      const value = Math.floor(Math.random() * 100);
      return { hour, plays: value, intensity: value > 75 ? "high" : value > 40 ? "medium" : "low" };
    });

    return { heatmap: hourlyMap, date: targetDate };
  });

  app.get("/api/analytics/campaigns", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };

    const allCampaigns = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.tenantId, tenantId as string));

    const campaignPerformance = await Promise.all(
      allCampaigns.map(async (campaign) => {
        const agg = await db
          .select({
            plays: sql<number>`COALESCE(SUM(${analyticsDaily.totalPlays}), 0)`,
            listeners: sql<number>`COALESCE(SUM(${analyticsDaily.uniqueListeners}), 0)`,
          })
          .from(analyticsDaily)
          .where(eq(analyticsDaily.campaignId, campaign.id));

        const auditCount = await db
          .select({ count: count() })
          .from(audioAuditLogs)
          .where(eq(audioAuditLogs.campaignId, campaign.id));

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          plays: Number(agg[0]?.plays ?? 0),
          listeners: Number(agg[0]?.listeners ?? 0),
          audits: Number(auditCount[0]?.count ?? 0),
          createdAt: campaign.createdAt.toISOString(),
        };
      }),
    );

    campaignPerformance.sort((a, b) => b.plays - a.plays);

    return { campaigns: campaignPerformance };
  });

  app.get("/api/analytics/export", async (request, reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const query = request.query as { from?: string; to?: string; format?: string };

    const conditions = [eq(analyticsDaily.tenantId, tenantId as string)];
    if (query.from) conditions.push(gte(analyticsDaily.date, query.from));
    if (query.to) conditions.push(lte(analyticsDaily.date, query.to));

    const rows = await db
      .select()
      .from(analyticsDaily)
      .where(and(...conditions))
      .orderBy(desc(analyticsDaily.date));

    const header = "date,store_id,total_plays,unique_listeners,avg_duration_sec,campaign_id\n";
    const csv = header + rows
      .map((r) => `${r.date},${r.storeId ?? ""},${r.totalPlays},${r.uniqueListeners},${r.avgListenDurationSec},${r.campaignId ?? ""}`)
      .join("\n");

    reply.header("Content-Type", "text/csv");
    reply.header("Content-Disposition", "attachment; filename=analytics-export.csv");
    return reply.send(csv);
  });
}
