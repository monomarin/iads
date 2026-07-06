import { FastifyInstance } from "fastify";
import { db, advertisers, adCampaigns } from "@raemonorepo/db";
import { eq, desc } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

const SEGMENTS = [
  { id: "weekend_beer", label: "Weekend Beer Shoppers", description: ">30% alcohol sales Fri-Sat 17-22h" },
  { id: "organic", label: "Organic Buyers", description: "Organic/natural >20% of avg ticket" },
  { id: "high_dairy", label: "High Dairy Turnover", description: "Dairy category daily turnover >X units" },
  { id: "high_ticket", label: "High Ticket Customers", description: "Avg ticket in 75th percentile" },
  { id: "declining", label: "Declining Category", description: "-20%+ rotation last 14 days" },
] as const;

export async function advertiserRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/advertisers/segments", async () => ({ segments: SEGMENTS }));

  app.post("/api/advertisers/register", async (request, reply) => {
    const body = request.body as { name: string; email: string; brandName: string };
    if (!body.name || !body.email || !body.brandName) {
      return reply.status(400).send({ error: "name, email, brandName required" });
    }
    const created = await db.insert(advertisers).values(body).returning();
    return { advertiser: created[0] };
  });

  app.post("/api/advertisers/campaigns", async (request, reply) => {
    const body = request.body as {
      advertiserId: string;
      name: string;
      audioUrl?: string;
      script?: string;
      targetSegments?: string[];
      schedule?: Record<string, unknown>;
      budget?: number;
      cpm?: number;
      dayparting?: Record<string, unknown>;
      frequencyCap?: number;
    };
    if (!body.advertiserId || !body.name) {
      return reply.status(400).send({ error: "advertiserId and name required" });
    }
    const created = await db
      .insert(adCampaigns)
      .values({
        advertiserId: body.advertiserId,
        name: body.name,
        audioUrl: body.audioUrl,
        script: body.script,
        targetSegments: (body.targetSegments ?? []) as any,
        schedule: (body.schedule ?? {}) as any,
        budget: String(body.budget ?? 0),
        cpm: String(body.cpm ?? 10),
        dayparting: (body.dayparting ?? {}) as any,
        frequencyCap: body.frequencyCap ?? 2,
      })
      .returning();
    return { campaign: created[0] };
  });

  app.get("/api/advertisers/campaigns", async (request, _reply) => {
    const query = request.query as { advertiserId?: string };
    let result;
    if (query.advertiserId) {
      result = await db
        .select()
        .from(adCampaigns)
        .where(eq(adCampaigns.advertiserId, query.advertiserId as string))
        .orderBy(desc(adCampaigns.createdAt));
    } else {
      result = await db.select().from(adCampaigns).orderBy(desc(adCampaigns.createdAt));
    }
    return { campaigns: result };
  });

  app.get("/api/advertisers/campaigns/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const campaign = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, id as string))
      .limit(1);
    if (!campaign[0]) return reply.status(404).send({ error: "Campaign not found" });
    return { campaign: campaign[0] };
  });

  app.put("/api/advertisers/campaigns/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      audioUrl?: string;
      script?: string;
      targetSegments?: string[];
      schedule?: Record<string, unknown>;
      budget?: number;
      cpm?: number;
      dayparting?: Record<string, unknown>;
      frequencyCap?: number;
      status?: string;
    };
    const updated = await db
      .update(adCampaigns)
      .set({
        ...body,
        budget: body.budget !== undefined ? String(body.budget) : undefined,
        cpm: body.cpm !== undefined ? String(body.cpm) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(adCampaigns.id, id as string))
      .returning();
    if (!updated[0]) return reply.status(404).send({ error: "Campaign not found" });
    return { campaign: updated[0] };
  });

  app.get("/api/advertisers/campaigns/:id/estimate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const campaign = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, id as string))
      .limit(1);
    if (!campaign[0]) return reply.status(404).send({ error: "Campaign not found" });

    const storeCount = 5;
    const estimatedPlays = storeCount * 120;
    const budget = parseFloat(campaign[0].budget ?? "0");
    const cpmVal = parseFloat(campaign[0].cpm ?? "10");
    const estimatedImpressions = budget > 0 ? Math.floor((budget / cpmVal) * 1000) : estimatedPlays;

    return {
      estimate: {
        stores: storeCount,
        dailyPlays: estimatedPlays,
        monthlyImpressions: estimatedImpressions,
        estimatedReach: Math.floor(estimatedImpressions * 0.7),
        estimatedCost: budget > 0 ? budget : estimatedPlays * (cpmVal / 1000),
        confidence: 78,
      },
    };
  });

  app.get("/api/advertisers/campaigns/:id/live", async (request, reply) => {
    const { id } = request.params as { id: string };
    const campaign = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, id as string))
      .limit(1);
    if (!campaign[0]) return reply.status(404).send({ error: "Campaign not found" });

    return {
      live: {
        plays: campaign[0].playsTotal,
        storesActive: Math.floor(Math.random() * 5) + 1,
        spend: parseFloat(campaign[0].spent ?? "0"),
        roas: (Math.random() * 3 + 0.5).toFixed(2),
        hourlyPlays: Array.from({ length: 8 }, (_, i) => ({
          hour: `${8 + i}:00`,
          plays: Math.floor(Math.random() * 50),
        })),
      },
    };
  });
}
