import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, analyticsDaily, syncLogs, edgeNodes, stores, campaigns } from "@raemonorepo/db";
import { eq, and, desc, sql, count } from "drizzle-orm";

async function getAuthContext() {
  const session = await auth();
  let tenantId: string | null = null;
  let userId: string | null = null;
  let userRole: string | null = null;

  try {
    const claims = session.sessionClaims as Record<string, unknown> | null;
    tenantId = (claims?.tenant_id as string) ?? null;
    userId = session.userId;
    userRole = (claims?.role as string) ?? null;
  } catch {
    // token parsing failed
  }

  return { tenantId, userId, userRole };
}

async function handleAnalyticsOverview(): Promise<NextResponse> {
  const { tenantId } = await getAuthContext();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
}

export async function GET(_request: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = params.slug?.join("/") ?? "";

  try {
    switch (path) {
      case "health":
        return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });

      case "analytics/overview":
        return handleAnalyticsOverview();

      default:
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (err) {
    console.error(`API error (GET /${path}):`, err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, _context: { params: { slug: string[] } }) {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function PUT(_request: NextRequest, _context: { params: { slug: string[] } }) {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function PATCH(_request: NextRequest, _context: { params: { slug: string[] } }) {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function DELETE(_request: NextRequest, _context: { params: { slug: string[] } }) {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
