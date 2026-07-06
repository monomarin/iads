"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface AmbientConfig {
  enabled: boolean;
  thresholds: [number, number];
  nightCap: number;
  manualOverrideUntil: string | null;
}

export default function AmbientConfigPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [config, setConfig] = useState<AmbientConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !id) { router.push("/sign-in"); return; }
    loadConfig();
  }, [isSignedIn, id]);

  async function loadConfig() {
    const token = (await getToken()) || undefined;
    const data = await api.get(`/edge-nodes/${id}/ambient-config`, token);
    setConfig(data.config);
    setLoading(false);
  }

  async function save() {
    if (!config) return;
    const token = (await getToken()) || undefined;
    setSaving(true);
    try {
      await api.put(`/edge-nodes/${id}/ambient-config`, config, token);
    } finally {
      setSaving(false);
    }
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Ambient Volume</h1>
          <Button variant="outline" onClick={() => router.push(`/settings/edge-nodes/${id}`)}>Back</Button>
        </div>

        <Card className="mb-6 p-4">
          <h2 className="mb-4 text-lg font-medium">Configuration</h2>

          <div className="mb-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="enabled"
              checked={config?.enabled ?? true}
              onChange={(e) => setConfig(config ? { ...config, enabled: e.target.checked } : null)}
              className="rounded border-border"
            />
            <label htmlFor="enabled" className="text-sm text-foreground">Enabled</label>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted-foreground">Low threshold (dB)</label>
            <input
              type="number"
              value={config?.thresholds[0] ?? 40}
              onChange={(e) => setConfig(config ? { ...config, thresholds: [parseInt(e.target.value, 10), config.thresholds[1] ?? 65] } : null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              min={0}
              max={100}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">Below this = quiet store (40% volume)</p>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted-foreground">High threshold (dB)</label>
            <input
              type="number"
              value={config?.thresholds[1] ?? 65}
              onChange={(e) => setConfig(config ? { ...config, thresholds: [config.thresholds[0] ?? 40, parseInt(e.target.value, 10)] } : null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              min={0}
              max={100}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">Above this = crowded store (100% volume)</p>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted-foreground">Night cap (%)</label>
            <input
              type="number"
              value={config?.nightCap ?? 50}
              onChange={(e) => setConfig(config ? { ...config, nightCap: parseInt(e.target.value, 10) } : null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              min={0}
              max={100}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">Max volume during 23:00–07:00</p>
          </div>

          {config?.manualOverrideUntil && (
            <div className="mb-4 rounded-lg bg-warning/10 p-3">
              <p className="text-xs text-warning">
                Manual volume override active until {new Date(config.manualOverrideUntil).toLocaleString()}
              </p>
            </div>
          )}

          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-medium text-foreground">Volume Map</h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex justify-between"><span>&lt;{config?.thresholds[0] ?? 40} dB</span><span className="font-mono">40% volume</span></p>
            <p className="flex justify-between"><span>{config?.thresholds[0] ?? 40}–{config?.thresholds[1] ?? 65} dB</span><span className="font-mono">70% volume</span></p>
            <p className="flex justify-between"><span>&gt;{config?.thresholds[1] ?? 65} dB</span><span className="font-mono">100% volume</span></p>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Fade transitions: 3s · Night cap: {config?.nightCap ?? 50}%</p>
        </Card>
      </div>
    </div>
  );
}
