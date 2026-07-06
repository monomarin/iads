"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
}

const ALL_EVENTS = [
  "sync.completed", "sync.failed", "campaign.activated", "campaign.ended",
  "approval.resolved", "audio.audit.issue", "brand.safety.alert", "billing.receipt",
];

export default function WebhooksPage() {
  const { getToken, isSignedIn } = useAuth();
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: "", events: [] as string[] });

  useEffect(() => {
    if (!isSignedIn) return;
    loadHooks();
  }, [isSignedIn]);

  async function loadHooks() {
    const token = (await getToken()) || undefined;
    const res = await api.get("/api/developer/webhooks", token);
    setHooks((res as { webhooks: Webhook[] }).webhooks ?? []);
    setLoading(false);
  }

  async function createHook() {
    const token = (await getToken()) || undefined;
    await api.post("/api/developer/webhooks", form, token);
    setShowForm(false);
    setForm({ url: "", events: [] });
    loadHooks();
  }

  async function deleteHook(id: string) {
    const token = (await getToken()) || undefined;
    await api.delete(`/api/developer/webhooks/${id}`, token);
    loadHooks();
  }

  function toggleEvent(evt: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(evt) ? f.events.filter((e) => e !== evt) : [...f.events, evt],
    }));
  }

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Webhooks</h1>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Webhook
          </button>
        </div>

        {showForm && (
          <Card className="mb-6 p-4">
            <h2 className="mb-3 font-semibold text-foreground">New Webhook</h2>
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                placeholder="https://example.com/webhook"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Subscribe to events:</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_EVENTS.map((evt) => (
                    <label key={evt} className="flex cursor-pointer items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={form.events.includes(evt)}
                        onChange={() => toggleEvent(evt)}
                        className="h-3 w-3 accent-primary"
                      />
                      <span className="text-foreground">{evt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={createHook} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
                  Create
                </button>
                <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground">
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {hooks.map((hook) => (
            <Card key={hook.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${hook.isActive ? "bg-success" : "bg-destructive"}`} />
                    <span className="font-mono text-sm text-foreground">{hook.url}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(hook.events as string[]).join(", ") || "No events"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(hook.createdAt).toLocaleDateString()}
                    {hook.lastTriggeredAt ? ` · Last triggered ${new Date(hook.lastTriggeredAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => deleteHook(hook.id)}
                  className="rounded-lg border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
          {hooks.length === 0 && <div className="mt-10 text-center text-muted-foreground">No webhooks configured.</div>}
        </div>
      </div>
    </div>
  );
}
