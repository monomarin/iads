"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface ApprovalRequest {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  activate_campaign: "Activate Campaign",
  publish_playlist: "Publish Playlist",
  force_sync: "Force Sync",
  upload_audio: "Upload Audio",
  change_schedule: "Change Schedule",
  edge_command: "Edge Command",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-500",
  approved: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
};

export default function ApprovalsPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadApprovals();
  }, [isSignedIn, filter]);

  async function loadApprovals() {
    const token = (await getToken()) || undefined;
    const query = filter ? `?status=${filter}` : "";
    const [data, statsData] = await Promise.all([
      api.get(`/approvals${query}`, token),
      api.get("/approvals/stats", token),
    ]);
    setApprovals(data.approvals ?? []);
    setStats(statsData);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Approvals</h1>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </Card>
        </div>

        <div className="mb-6 flex gap-2">
          {["", "pending", "approved", "rejected"].map((s) => (
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
        ) : approvals.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">No approval requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((req) => (
              <Card
                key={req.id}
                className="cursor-pointer p-4 transition-all hover:border-primary/50"
                onClick={() => router.push(`/approvals/${req.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status] ?? ""}`}>
                      {req.status}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {ACTION_LABELS[req.action] ?? req.action}
                    </span>
                    <span className="text-xs text-muted-foreground">{req.target_type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleString()}
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
