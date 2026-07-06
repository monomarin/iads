"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface SyncStatus {
  lastSync: {
    status: string;
    type: string;
    started_at: string;
    finished_at: string | null;
    items_synced: number;
    items_failed: number;
    error_log: string | null;
  } | null;
}

interface SyncLog {
  id: string;
  status: string;
  type: string;
  started_at: string;
  finished_at: string | null;
  items_synced: number;
  items_failed: number;
  error_log: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  success: "bg-success/20 text-success",
  failed: "bg-destructive/20 text-destructive",
  running: "bg-primary/20 text-primary",
  pending: "bg-muted text-muted-foreground",
};

export default function SyncPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadData();
  }, [isSignedIn]);

  async function loadData() {
    const token = (await getToken()) || undefined;
    const [statusData, logsData] = await Promise.all([
      api.get("/sync/status?storeId=all", token).catch(() => ({ lastSync: null })),
      api.get("/sync/logs", token),
    ]);
    setStatus(statusData);
    setLogs(logsData.logs ?? []);
    setLoading(false);
  }

  async function triggerSync() {
    const token = (await getToken()) || undefined;
    setSyncing(true);
    try {
      await api.post("/sync/trigger", { storeId: "all" }, token);
      await loadData();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Sync</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/sync/schedule")}>
              Schedule
            </Button>
            <Button onClick={triggerSync} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </div>

        <Card className="mb-6 p-4">
          <h2 className="mb-3 text-lg font-medium">Last Sync</h2>
          {loading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : status?.lastSync ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status.lastSync.status] ?? ""}`}>
                  {status.lastSync.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm text-foreground">{status.lastSync.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Synced</p>
                <p className="text-sm text-foreground">{status.lastSync.items_synced}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-sm text-foreground">{status.lastSync.items_failed}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sync history yet</p>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-lg font-medium">Sync History</h2>
          {loading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync history</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[log.status] ?? ""}`}>
                      {log.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{log.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{log.items_synced} synced</span>
                    {log.items_failed > 0 && (
                      <span className="text-destructive">{log.items_failed} failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
