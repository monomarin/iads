"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface AdCampaign {
  id: string;
  name: string;
  status: string;
  budget: string;
  spent: string;
  playsTotal: number;
  createdAt: string;
}

export default function AdvertiserCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const aid = localStorage.getItem("advertiserId");
    if (!aid) {
      router.push("/advertiser/register");
      return;
    }
    loadCampaigns(aid);
  }, []);

  async function loadCampaigns(aid: string) {
    const data = await api.get(`/api/advertisers/campaigns?advertiserId=${aid}`);
    setCampaigns((data as { campaigns: AdCampaign[] }).campaigns ?? []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">My Campaigns</h1>
          <button
            onClick={() => router.push("/advertiser/campaigns/new")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New Campaign
          </button>
        </div>

        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        ) : campaigns.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">No campaigns yet. Create your first one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <Card
                key={c.id}
                className="flex cursor-pointer items-center justify-between p-4 hover:bg-accent/50"
                onClick={() => router.push(`/advertiser/campaigns/${c.id}`)}
              >
                <div>
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{c.playsTotal} plays</span>
                  <span className="text-sm font-mono text-foreground">
                    ${c.spent} / ${c.budget}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      c.status === "live" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
