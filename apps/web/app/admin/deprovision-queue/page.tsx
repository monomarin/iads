"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface QueueItem {
  id: string;
  name: string;
  slug: string;
  deprovision_step: string;
  suspended_at: string | null;
  deletion_scheduled_at: string | null;
}

const STEP_COLORS: Record<string, string> = {
  suspended: "bg-amber-500/20 text-amber-500",
  grace: "bg-warning/20 text-warning",
  warning: "bg-destructive/20 text-destructive",
  deleting: "bg-destructive/20 text-destructive",
  deleted: "bg-muted text-muted-foreground",
};

export default function DeprovisionQueuePage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadQueue();
  }, [isSignedIn]);

  async function loadQueue() {
    const token = (await getToken()) || undefined;
    const data = await api.get("/admin/deprovision-queue", token);
    setQueue(data.queue ?? []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">De-provision Queue</h1>

        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        ) : queue.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">No tenants in de-provisioning process</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((item) => {
              const daysSinceSuspend = item.suspended_at
                ? Math.floor((Date.now() - new Date(item.suspended_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.slug}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STEP_COLORS[item.deprovision_step] ?? ""}`}>
                        {item.deprovision_step}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {daysSinceSuspend}d ago
                      </span>
                      {item.deletion_scheduled_at && (
                        <span className="text-xs text-destructive">
                          Deleted
                        </span>
                      )}
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
