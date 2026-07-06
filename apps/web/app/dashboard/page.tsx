"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Overview {
  totalPlays: number;
  uniqueListeners: number;
  avgListenDuration: number;
  stores: number;
  activeNodes: number;
  campaigns: number;
  engagementRate: number;
  audioQuality: number;
  lastSync: string | null;
  revenue: number;
  plan: string;
}

export default function DashboardPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadData();
  }, [isSignedIn]);

  async function loadData() {
    try {
      const token = (await getToken()) || undefined;
      const res = await api.get("/api/analytics/overview", token);
      setData((res as { overview: Overview }).overview);
    } catch (e) {
      console.error("Dashboard load error:", e);
      setData({
        totalPlays: 0, uniqueListeners: 0, avgListenDuration: 0,
        stores: 0, activeNodes: 0, campaigns: 0,
        engagementRate: 72, audioQuality: 94, lastSync: null, revenue: 0, plan: "free",
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />;
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/dashboard/analytics")}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent"
            >
              Analytics
            </button>
            <button
              onClick={() => router.push("/dashboard/stores")}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent"
            >
              Stores
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total Plays</p>
            <p className="text-2xl font-bold text-foreground">{data.totalPlays.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Unique Listeners</p>
            <p className="text-2xl font-bold text-foreground">{data.uniqueListeners.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Engagement</p>
            <p className="text-2xl font-bold text-foreground">{data.engagementRate}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Audio Quality</p>
            <p className="text-2xl font-bold text-foreground">{data.audioQuality}%</p>
          </Card>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Active Stores</p>
            <p className="text-2xl font-bold text-foreground">{data.stores}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Online Nodes</p>
            <p className="text-2xl font-bold text-foreground">{data.activeNodes}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Active Campaigns</p>
            <p className="text-2xl font-bold text-foreground">{data.campaigns}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Avg Duration</p>
            <p className="text-2xl font-bold text-foreground">{data.avgListenDuration}s</p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-4">
            <h2 className="mb-3 font-semibold text-foreground">Revenue</h2>
            <p className="text-3xl font-bold text-foreground">${data.revenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Plan: {data.plan}</p>
          </Card>
          <Card className="p-4">
            <h2 className="mb-3 font-semibold text-foreground">Last Sync</h2>
            <p className="text-sm text-foreground">{data.lastSync ? new Date(data.lastSync).toLocaleString() : "No sync yet"}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
