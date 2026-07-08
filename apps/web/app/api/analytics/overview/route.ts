import { NextRequest, NextResponse } from "next/server";
import { db, analyticsDaily, syncLogs, edgeNodes, stores, campaigns, users, tenants } from "@raemonorepo/db";
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";


async function getOrProvisionUser(clerkUserId: string) {
  // Find user in DB
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUserId))
    .limit(1);

  if (userResult[0]) {
    return userResult[0];
  }

  // Not in DB (webhook missed or first login). Auto-provision.
  console.log(`[Overview API] Auto-provisioning user ${clerkUserId}`);
  
  const slug = `tenant-${clerkUserId.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  const tenantName = "Mi Organización";

  const newTenant = await db.insert(tenants).values({
    name: tenantName,
    slug: `${slug}-${Date.now()}`,
    features: ["analytics", "campaigns", "playlists", "edge-nodes", "billing"],
  }).returning();

  const tenantId = newTenant[0]!.id;
  const email = `user_${clerkUserId.slice(-8)}@local.dev`;

  const newUser = await db.insert(users).values({
    clerkId: clerkUserId,
    tenantId: tenantId,
    email,
    role: "store_admin",
  }).returning();

  return newUser[0]!;
}

export async function GET(_request: NextRequest) {
  const { userId: clerkUserId } = auth();

  if (!clerkUserId) {
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
    const user = await getOrProvisionUser(clerkUserId);
    const tenantId = user.tenantId;

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
          .where(inArray(syncLogs.storeId, storeIds))
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
