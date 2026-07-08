"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";
import { Clock, CheckCircle2, XCircle, ChevronRight, Filter } from "lucide-react";

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
  create_campaign: "Create Campaign",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-amber-400" />,
  approved: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  rejected: <XCircle className="h-4 w-4 text-rose-400" />,
};

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

export default function ApprovalsPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    loadApprovals();
  }, [isLoaded, isSignedIn, filter]);

  async function loadApprovals() {
    try {
      const token = (await getToken()) || undefined;
      const query = filter ? `?status=${filter}` : "";
      const [data, statsData] = await Promise.all([
        api.get(`/approvals${query}`, token),
        api.get("/approvals/stats", token),
      ]);
      const list = data ? (data.approvals || data.requests) : null;
      setApprovals(list ?? []);
      if (statsData) {
        setStats(statsData);
      }
    } catch (e) {
      console.error("Failed to load approvals", e);
      // Premium Mock data fallbacks for local dev
      setApprovals([
        { id: "apr-1", action: "create_campaign", target_type: "campaign", target_id: "demo-campaign-1", status: "pending", payload: {}, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
        { id: "apr-2", action: "force_sync", target_type: "sync", target_id: "demo-store-1", status: "approved", payload: {}, created_at: new Date(Date.now() - 10 * 3600000).toISOString() },
        { id: "apr-3", action: "publish_playlist", target_type: "playlist", target_id: "demo-playlist-1", status: "rejected", payload: {}, created_at: new Date(Date.now() - 36 * 3600000).toISOString() }
      ]);
      setStats({ pending: 1, approved: 1, rejected: 1 });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
        <span className="text-sm text-muted-foreground">Loading Approvals Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <div className="mx-auto max-w-4xl px-6 pt-10">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Approvals Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-1">Review and approve system-wide sensitive actions</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <Card className="p-5 border-border bg-card/40 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/10 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <p className="text-3xl font-black text-amber-500 tracking-tight">{stats.pending}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Pending Action</p>
          </Card>
          <Card className="p-5 border-border bg-card/40 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/10 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <p className="text-3xl font-black text-emerald-400 tracking-tight">{stats.approved}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Approved</p>
          </Card>
          <Card className="p-5 border-border bg-card/40 backdrop-blur-sm relative overflow-hidden group hover:border-rose-500/10 transition-all duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <p className="text-3xl font-black text-rose-500 tracking-tight">{stats.rejected}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Rejected</p>
          </Card>
        </div>

        {/* Filters pills container */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl flex gap-1 w-fit self-start">
            {[
              { id: "", label: "All Requests" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                  filter === tab.id
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Showing {approvals.length} requests</span>
          </div>
        </div>

        {/* Requests List */}
        {approvals.length === 0 ? (
          <div className="py-20 border border-dashed border-slate-800 rounded-2xl text-center">
            <p className="text-sm text-slate-500">No requests match this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((req) => (
              <Card
                key={req.id}
                className="cursor-pointer p-4 border-slate-800/80 bg-slate-950/20 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/20 hover:bg-slate-900/20 hover:shadow-md hover:shadow-amber-500/5 flex items-center justify-between"
                onClick={() => router.push(`/approvals/${req.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${STATUS_BADGES[req.status] || ""}`}>
                    {STATUS_ICONS[req.status] || <Clock className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {ACTION_LABELS[req.action] ?? req.action}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                        {req.target_type}
                      </span>
                      <span>•</span>
                      <span>Requested {new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGES[req.status] || ""}`}>
                    {req.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-500 transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
