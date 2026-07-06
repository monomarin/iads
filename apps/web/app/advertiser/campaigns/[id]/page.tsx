"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface CampaignDetail {
  id: string;
  name: string;
  status: string;
  budget: string;
  spent: string;
  cpm: string;
  playsTotal: number;
  frequencyCap: number;
  targetSegments: string[];
  createdAt: string;
}

interface LiveMetrics {
  plays: number;
  storesActive: number;
  spend: number;
  roas: string;
  hourlyPlays: Array<{ hour: string; plays: number }>;
}

export default function AdCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [live, setLive] = useState<LiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadData();
    const interval = setInterval(loadLive, 30000);
    return () => clearInterval(interval);
  }, [id]);

  async function loadData() {
    const c = await api.get(`/api/advertisers/campaigns/${id}`);
    setCampaign((c as { campaign: CampaignDetail }).campaign);
    const l = await api.get(`/api/advertisers/campaigns/${id}/live`);
    setLive((l as { live: LiveMetrics }).live);
    setLoading(false);
  }

  async function loadLive() {
    const l = await api.get(`/api/advertisers/campaigns/${id}/live`);
    setLive((l as { live: LiveMetrics }).live);
  }

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />;
  }

  if (!campaign) return <div className="p-6 text-destructive">Campaign not found</div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground">Created {new Date(campaign.createdAt).toLocaleDateString()}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              campaign.status === "live" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
            }`}
          >
            {campaign.status}
          </span>
        </div>

        {live && (
          <div className="mb-6 grid grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{live.plays}</p>
              <p className="text-xs text-muted-foreground">Total Plays</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{live.storesActive}</p>
              <p className="text-xs text-muted-foreground">Active Stores</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">${live.spend}</p>
              <p className="text-xs text-muted-foreground">Spent</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{live.roas}x</p>
              <p className="text-xs text-muted-foreground">ROAS</p>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2 p-4">
            <h2 className="mb-3 font-semibold text-foreground">Hourly Plays</h2>
            {live?.hourlyPlays ? (
              <div className="space-y-2">
                {live.hourlyPlays.map((h) => (
                  <div key={h.hour} className="flex items-center gap-3">
                    <span className="w-12 text-xs text-muted-foreground">{h.hour}</span>
                    <div className="h-4 flex-1 rounded bg-muted">
                      <div
                        className="h-full rounded bg-primary"
                        style={{ width: `${Math.min(100, h.plays * 2)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-foreground">{h.plays}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 font-semibold text-foreground">Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget</span>
                <span className="text-foreground">${campaign.budget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spent</span>
                <span className="text-foreground">${campaign.spent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CPM</span>
                <span className="text-foreground">${campaign.cpm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequency Cap</span>
                <span className="text-foreground">{campaign.frequencyCap}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Segments</span>
                <span className="text-foreground">{campaign.targetSegments?.length ?? 0}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
