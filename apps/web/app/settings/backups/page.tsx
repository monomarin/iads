"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface BackupConfig {
  id: string;
  retention_days: number;
  frequency: string;
  time: string;
}

interface BackupLog {
  id: string;
  status: string;
  size: string | null;
  started_at: string;
  finished_at: string | null;
  error_log: string | null;
}

export default function BackupsPage() {
  const { getToken, isSignedIn } = useAuth();
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadData();
  }, [isSignedIn]);

  async function loadData() {
    const token = (await getToken()) || undefined;
    const [cfg, logsData] = await Promise.all([
      api.get("/backups/config", token),
      api.get("/backups/logs", token),
    ]);
    setConfig(cfg.config);
    setLogs(logsData.logs ?? []);
    setLoading(false);
  }

  async function saveConfig() {
    if (!config) return;
    const token = (await getToken()) || undefined;
    await api.put("/backups/config", {
      retentionDays: config.retention_days,
      frequency: config.frequency,
      time: config.time,
    }, token);
    await loadData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Backups</h1>

        <Card className="mb-6 p-4">
          <h2 className="mb-4 text-lg font-medium">Configuration</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted-foreground">Retention (days)</label>
            <input
              type="number"
              value={config?.retention_days ?? 30}
              onChange={(e) => setConfig(config ? { ...config, retention_days: parseInt(e.target.value, 10) } : null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              min={1}
              max={365}
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted-foreground">Frequency</label>
            <select
              value={config?.frequency ?? "daily"}
              onChange={(e) => setConfig(config ? { ...config, frequency: e.target.value } : null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted-foreground">Time</label>
            <input
              type="time"
              value={config?.time ?? "03:00"}
              onChange={(e) => setConfig(config ? { ...config, time: e.target.value } : null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>
          <Button onClick={saveConfig}>Save</Button>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-lg font-medium">History</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No backups yet</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${log.status === "success" ? "bg-success" : log.status === "failed" ? "bg-destructive" : "bg-muted-foreground"}`} />
                    <span className="text-sm text-foreground">{log.status}</span>
                    {log.size && <span className="text-xs text-muted-foreground">{log.size}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.started_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
