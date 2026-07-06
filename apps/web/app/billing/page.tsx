"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  price: string;
  maxStores: number;
  maxPlays: number;
  features: string[];
}

interface CurrentSub {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  currentPeriodEnd: string | null;
  plan: Plan | null;
}

export default function BillingPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<CurrentSub | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadAll();
  }, [isSignedIn]);

  async function loadAll() {
    const token = (await getToken()) || undefined;
    const [p, c] = await Promise.all([
      api.get("/api/billing/plans", token),
      api.get("/api/billing/current", token),
    ]);
    setPlans((p as { plans: Plan[] }).plans ?? []);
    const sub = (c as { subscription: CurrentSub | null }).subscription;
    setCurrent(sub);
    setLoading(false);
  }

  async function selectPlan(planId: string) {
    const token = (await getToken()) || undefined;
    await api.post("/api/billing/checkout", { planId }, token);
    router.push("/billing/subscription");
  }

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Billing</h1>

        {current && (
          <Card className="mb-6 p-4">
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-lg font-bold text-foreground">{current.plan?.name ?? "Unknown"}</p>
            <p className="text-xs text-muted-foreground">
              Status: {current.status} · Renews: {current.currentPeriodEnd ? new Date(current.currentPeriodEnd).toLocaleDateString() : "N/A"}
            </p>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={`p-6 ${current?.planId === plan.id ? "ring-2 ring-primary" : ""}`}>
              <h2 className="text-lg font-bold text-foreground">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold text-foreground">
                ${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="mt-4 space-y-2">
                {(plan.features as string[]).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-success">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => selectPlan(plan.id)}
                disabled={current?.planId === plan.id}
                className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {current?.planId === plan.id ? "Current" : plan.price === "0" ? "Free" : "Subscribe"}
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
