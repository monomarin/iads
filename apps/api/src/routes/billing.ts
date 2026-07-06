import { FastifyInstance } from "fastify";
import { db, subscriptionPlans, tenantSubscriptions, invoices } from "@raemonorepo/db";
import { eq, desc } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

const DEFAULT_PLANS = [
  { name: "Free", price: "0", maxStores: 1, maxPlays: 10000, features: JSON.stringify(["1 store", "10K plays/mo", "Basic analytics"]) },
  { name: "Pro", price: "99", maxStores: 10, maxPlays: 100000, features: JSON.stringify(["10 stores", "100K plays/mo", "Advanced analytics", "Priority support"]) },
  { name: "Enterprise", price: "499", maxStores: 100, maxPlays: 1000000, features: JSON.stringify(["100 stores", "1M plays/mo", "Custom reports", "Dedicated support", "API access", "SSO"]) },
];

export async function billingRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/billing/plans", async () => {
    const existing = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
    if (existing.length > 0) return { plans: existing };

    const seeded = await db.insert(subscriptionPlans).values(DEFAULT_PLANS).returning();
    return { plans: seeded };
  });

  app.post("/api/billing/checkout", async (request, reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const body = request.body as { planId: string };

    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, body.planId as string))
      .limit(1);
    if (!plan[0]) return reply.status(404).send({ error: "Plan not found" });

    const existing = await db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, tenantId as string))
      .limit(1);

    if (existing[0]) {
      await db
        .update(tenantSubscriptions)
        .set({
          planId: body.planId as string,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .where(eq(tenantSubscriptions.id, existing[0].id));
    } else {
      await db.insert(tenantSubscriptions).values({
        tenantId: tenantId as string,
        planId: body.planId as string,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    return { checkoutUrl: `/billing/subscription`, success: true };
  });

  app.get("/api/billing/current", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };

    const sub = await db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, tenantId as string))
      .limit(1);

    if (!sub[0]) {
      return { subscription: null };
    }

    const plan = sub[0].planId
      ? await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, sub[0].planId)).limit(1)
      : [];

    return {
      subscription: {
        ...sub[0],
        plan: plan[0] ?? null,
      },
    };
  });

  app.put("/api/billing/cancel", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };

    await db
      .update(tenantSubscriptions)
      .set({ status: "cancelled", currentPeriodEnd: new Date() })
      .where(eq(tenantSubscriptions.tenantId, tenantId as string));

    return { success: true };
  });

  app.get("/api/billing/invoices", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };

    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId as string))
      .orderBy(desc(invoices.createdAt));

    if (rows.length === 0) {
      const mockInvoices = [
        { tenantId: tenantId as string, amount: "99", currency: "usd", status: "paid", paidAt: new Date(), pdfUrl: null },
        { tenantId: tenantId as string, amount: "99", currency: "usd", status: "paid", paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), pdfUrl: null },
      ];
      const seeded = await db.insert(invoices).values(mockInvoices).returning();
      return { invoices: seeded };
    }

    return { invoices: rows };
  });
}
