"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  docs: string;
  installed: boolean;
  integration: {
    id: string;
    isEnabled: boolean;
    config: Record<string, unknown>;
    lastSyncAt: string | null;
  } | null;
}

interface LogEntry {
  id: string;
  event: string;
  status: string;
  message: string;
  createdAt: string;
}

export default function IntegrationsPage() {
  const { getToken, isSignedIn } = useAuth();
  const [items, setItems] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<{ id: string; name: string; logs: LogEntry[] } | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    loadIntegrations();
  }, [isSignedIn]);

  async function loadIntegrations() {
    const token = (await getToken()) || undefined;
    const res = await api.get("/api/integrations", token);
    setItems((res as { integrations: IntegrationItem[] }).integrations ?? []);
    setLoading(false);
  }

  async function connect(provider: string) {
    const token = (await getToken()) || undefined;
    await api.post(`/api/integrations/${provider}/connect`, { configured: true }, token);
    loadIntegrations();
  }

  async function disconnect(id: string) {
    const token = (await getToken()) || undefined;
    await api.post(`/api/integrations/${id}/disconnect`, {}, token);
    loadIntegrations();
  }

  async function showLogs(id: string, name: string) {
    const token = (await getToken()) || undefined;
    const res = await api.get(`/api/integrations/${id}/logs`, token);
    setSelectedLogs({ id, name, logs: (res as { logs: LogEntry[] }).logs ?? [] });
  }

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Integrations</h1>

        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.installed && item.integration && (
                    <button
                      onClick={() => item.integration && showLogs(item.integration.id, item.name)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Logs
                    </button>
                  )}
                  {item.installed && item.integration?.isEnabled ? (
                    <button
                      onClick={() => item.integration && disconnect(item.integration.id)}
                      className="rounded-lg border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => connect(item.id)}
                      className="rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                    >
                      {item.installed ? "Enable" : "Connect"}
                    </button>
                  )}
                </div>
              </div>
              {item.installed && item.integration?.lastSyncAt && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Last sync: {new Date(item.integration.lastSyncAt).toLocaleString()}
                </p>
              )}
            </Card>
          ))}
        </div>

        {selectedLogs && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">{selectedLogs.name} Activity</h2>
              <button
                onClick={() => setSelectedLogs(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <Card className="p-4">
              {selectedLogs.logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedLogs.logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs">
                      <span className={`h-1.5 w-1.5 rounded-full ${log.status === "success" ? "bg-success" : "bg-destructive"}`} />
                      <span className="text-foreground">{log.event}</span>
                      <span className="text-muted-foreground">— {log.message}</span>
                      <span className="ml-auto text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
