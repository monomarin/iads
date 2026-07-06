"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface DailyRow {
  id: string;
  date: string;
  totalPlays: number;
  uniqueListeners: number;
  avgListenDurationSec: number;
}

interface CampaignPerf {
  id: string;
  name: string;
  status: string;
  plays: number;
  listeners: number;
  audits: number;
}

export default function AnalyticsPage() {
  const { getToken, isSignedIn } = useAuth();
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignPerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadAll();
  }, [isSignedIn]);

  async function loadAll() {
    const token = (await getToken()) || undefined;
    const [d, c] = await Promise.all([
      api.get("/api/analytics/daily", token),
      api.get("/api/analytics/campaigns", token),
    ]);
    setDaily((d as { daily: DailyRow[] }).daily ?? []);
    setCampaigns((c as { campaigns: CampaignPerf[] }).campaigns ?? []);
    setLoading(false);
  }

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Analytics</h1>

        <div className="mb-6 grid grid-cols-2 gap-6">
          <Card className="p-4">
            <h2 className="mb-3 font-semibold text-foreground">Daily Performance</h2>
            {daily.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {daily.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1">
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                    <div className="flex gap-3 text-xs text-foreground">
                      <span>{r.totalPlays} plays</span>
                      <span>{r.uniqueListeners} listeners</span>
                      <span>{r.avgListenDurationSec}s</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 font-semibold text-foreground">Campaign Performance</h2>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns yet</p>
            ) : (
              <div className="space-y-2">
                {campaigns.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                        c.status === "active" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      }`}>{c.status}</span>
                    </div>
                    <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                      <span>{c.plays} plays</span>
                      <span>{c.listeners} listeners</span>
                      <span>{c.audits} audits</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
