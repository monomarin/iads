import { NextRequest, NextResponse } from "next/server";
import { db, analyticsDaily, syncLogs, edgeNodes, stores, campaigns } from "@raemonorepo/db";
import { eq, and, desc, sql, count } from "drizzle-orm";

function decodeToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { tenantId: null, userId: null, userRole: null };
  }

  const token = authHeader.slice(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { tenantId: null, userId: null, userRole: null };
    }

    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64").toString("utf-8"),
    );

    return {
      tenantId: (payload.tenant_id ?? payload.org_id ?? null) as string | null,
      userId: (payload.sub as string) ?? null,
      userRole: (payload.role as string) ?? null,
    };
  } catch {
    return { tenantId: null, userId: null, userRole: null };
  }
}

export async function GET(request: NextRequest) {
  const { tenantId } = decodeToken(request);

  if (!tenantId) {
    return NextResponse.json({
      overview: {
        totalPlays: 0,
        uniqueListeners: 0,
        avgListenDuration: 0,
        stores: 0,
        activeNodes: 0,
        campaigns: 0,
        engagementRate: 72,
        audioQuality: 94,
        lastSync: null,
        revenue: 28450,
        plan: "free",
      },
    });
  }

  try {
    const dailyRows = await db
      .select({
        totalPlays: sql<number>`COALESCE(SUM(${analyticsDaily.totalPlays}), 0)`,
        uniqueListeners: sql<number>`COALESCE(SUM(${analyticsDaily.uniqueListeners}), 0)`,
        avgDuration: sql<number>`COALESCE(AVG(${analyticsDaily.avgListenDurationSec}), 0)`,
      })
      .from(analyticsDaily)
      .where(eq(analyticsDaily.tenantId, tenantId));

    const storeCount = await db
      .select({ count: count() })
      .from(stores)
      .where(eq(stores.tenantId, tenantId));

    const activeNodes = await db
      .select({ count: count() })
      .from(edgeNodes)
      .innerJoin(stores, eq(edgeNodes.storeId, stores.id))
      .where(and(eq(stores.tenantId, tenantId), eq(edgeNodes.isOnline, true)));

    const campaignCount = await db
      .select({ count: count() })
      .from(campaigns)
      .where(eq(campaigns.tenantId, tenantId));

    const storeIds = (await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.tenantId, tenantId))).map((s) => s.id);

    const lastSync = storeIds.length > 0
      ? await db
          .select({ finishedAt: syncLogs.finishedAt })
          .from(syncLogs)
          .where(and(...storeIds.map((sid) => eq(syncLogs.storeId, sid))))
          .orderBy(desc(syncLogs.finishedAt))
          .limit(1)
      : [];

    return NextResponse.json({
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
    });
  } catch (err) {
    console.error("Analytics overview error:", err);
    return NextResponse.json({
      overview: {
        totalPlays: 0,
        uniqueListeners: 0,
        avgListenDuration: 0,
        stores: 0,
        activeNodes: 0,
        campaigns: 0,
        engagementRate: 72,
        audioQuality: 94,
        lastSync: null,
        revenue: 0,
      },
    });
  }
}
