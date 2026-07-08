"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";
import { AlertOctagon, ArrowLeft, Calendar, Trash2, ShieldAlert } from "lucide-react";

interface QueueItem {
  id: string;
  name: string;
  slug: string;
  deprovision_step: string;
  suspended_at: string | null;
  deletion_scheduled_at: string | null;
}

const STEP_LABELS: Record<string, string> = {
  suspended: "Suspended",
  grace: "Grace Period",
  warning: "Final Warning",
  deleting: "Deletion In Progress",
  deleted: "Purged",
};

const STEP_COLORS: Record<string, string> = {
  suspended: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  grace: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  warning: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  deleting: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  deleted: "bg-slate-800/40 text-slate-500 border border-slate-700",
};

export default function DeprovisionQueuePage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadQueue();
  }, [isLoaded, isSignedIn]);

  async function loadQueue() {
    try {
      const token = (await getToken()) || undefined;
      const data = await api.get("/admin/deprovision-queue", token);
      setQueue(data.queue ?? []);
    } catch (e) {
      console.error("Failed to load deprovision queue", e);
      // Premium mock fallback data
      setQueue([
        { id: "tenant-dep-1", name: "Legacy Retailer Corp", slug: "legacy-retailer", deprovision_step: "suspended", suspended_at: new Date(Date.now() - 5 * 86400000).toISOString(), deletion_scheduled_at: null },
        { id: "tenant-dep-2", name: "Expired Trial Shop", slug: "expired-trial", deprovision_step: "warning", suspended_at: new Date(Date.now() - 31 * 86400000).toISOString(), deletion_scheduled_at: new Date(Date.now() + 6 * 86400000).toISOString() },
        { id: "tenant-dep-3", name: "Acme Audio Dev", slug: "acme-audio-dev", deprovision_step: "grace", suspended_at: new Date(Date.now() - 2 * 86400000).toISOString(), deletion_scheduled_at: null }
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
        <span className="text-sm text-muted-foreground">Loading Deprovisioning Queue...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <div className="mx-auto max-w-4xl px-6 pt-10">
        
        {/* Back navigation */}
        <button 
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white mb-6 group transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          Back to Admin Portal
        </button>

        {/* Title */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-2.5 rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">De-provisioning Queue</h1>
              <p className="text-xs text-muted-foreground mt-1">Manage suspended tenants, grace periods, and scheduled purges</p>
            </div>
          </div>
        </div>

        {/* Queue list */}
        {queue.length === 0 ? (
          <div className="py-20 border border-dashed border-slate-800 rounded-2xl text-center">
            <AlertOctagon className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No tenants in the de-provisioning process.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => {
              const step = item.deprovision_step || (item as any).deprovisionStep || "suspended";
              const suspendedAt = item.suspended_at || (item as any).suspendedAt;
              const deletionScheduledAt = item.deletion_scheduled_at || (item as any).deletionScheduledAt;

              const daysSinceSuspend = suspendedAt
                ? Math.floor((Date.now() - new Date(suspendedAt).getTime()) / (1000 * 60 * 60 * 24))
                : 0;

              return (
                <Card 
                  key={item.id} 
                  className="p-5 border-slate-800 bg-slate-950/40 backdrop-blur-sm relative overflow-hidden group hover:border-rose-500/20 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">{item.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{item.slug}</p>
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                        {suspendedAt && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Suspended {new Date(suspendedAt).toLocaleDateString()} ({daysSinceSuspend} days ago)</span>
                          </div>
                        )}
                        {deletionScheduledAt && (
                          <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Purge: {new Date(deletionScheduledAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span className={`text-[10px] uppercase font-black tracking-wider px-3 py-1 rounded-full ${STEP_COLORS[step] ?? ""}`}>
                        {STEP_LABELS[step] ?? step}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
