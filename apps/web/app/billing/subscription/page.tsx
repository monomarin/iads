"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

export default function SubscriptionPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadData();
  }, [isSignedIn]);

  async function loadData() {
    const token = (await getToken()) || undefined;
    const res = await api.get("/api/billing/current", token);
    setSub((res as { subscription: Record<string, unknown> | null }).subscription);
    setLoading(false);
  }

  async function cancel() {
    const token = (await getToken()) || undefined;
    await api.put("/api/billing/cancel", {}, token);
    router.push("/billing");
  }

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />;
  }

  if (!sub) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-xl font-semibold text-foreground">No active subscription</h1>
          <button onClick={() => router.push("/billing")} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Subscription</h1>
        <Card className="p-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-foreground capitalize">{String(sub.status)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium text-foreground">{String((sub.plan as Record<string, string>)?.name ?? "N/A")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period End</span>
              <span className="font-medium text-foreground">
                {sub.currentPeriodEnd ? new Date(String(sub.currentPeriodEnd)).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>

          <button
            onClick={cancel}
            className="mt-6 w-full rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            Cancel Subscription
          </button>
        </Card>
      </div>
    </div>
  );
}
