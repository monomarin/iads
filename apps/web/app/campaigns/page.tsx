"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Campaign {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  goal: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success/20 text-success",
  paused: "bg-warning/20 text-warning",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive",
};

export default function CampaignsPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [campaignList, setCampaignList] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadCampaigns();
  }, [isSignedIn, filter]);

  async function loadCampaigns() {
    const token = (await getToken()) || undefined;
    const query = filter ? `?status=${filter}` : "";
    const data = await api.get(`/campaigns${query}`, token);
    setCampaignList(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
          <Button onClick={() => router.push("/campaigns/new")}>
            New Campaign
          </Button>
        </div>

        <div className="mb-6 flex gap-2">
          {["", "draft", "active", "paused", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        ) : campaignList.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">No campaigns yet</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/campaigns/new")}>
              Create your first campaign
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaignList.map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer p-4 transition-all hover:border-primary/50"
                onClick={() => router.push(`/campaigns/${c.id}`)}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                    {c.status}
                  </span>
                  {c.goal && (
                    <span className="text-xs text-muted-foreground">{c.goal}</span>
                  )}
                </div>
                <h3 className="mb-1 font-medium text-foreground">{c.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {c.start_date ? new Date(c.start_date).toLocaleDateString() : "No start date"}
                  {c.end_date ? ` — ${new Date(c.end_date).toLocaleDateString()}` : ""}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
