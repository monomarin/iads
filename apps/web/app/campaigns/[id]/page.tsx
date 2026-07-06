"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Variant {
  id: string;
  role: string;
  script: string;
  weight: number;
  audio_url: string | null;
  is_generated: boolean;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  variants: Variant[];
}

const ROLE_LABELS: Record<string, string> = {
  control: "Control",
  variant_a: "Variant A",
  variant_b: "Variant B",
  variant_c: "Variant C",
  variant_d: "Variant D",
};

const STATUS_ACTIONS: Record<string, string[]> = {
  draft: ["active"],
  active: ["paused", "completed"],
  paused: ["active", "completed"],
  completed: [],
  cancelled: [],
};

export default function CampaignDetailPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { loadCampaign(); }, []);

  async function loadCampaign() {
    const token = (await getToken()) || undefined;
    try {
      const data = await api.get(`/campaigns/${params.id}`, token);
      setCampaign(data);
    } catch {
      setError("Campaign not found");
    }
    setLoading(false);
  }

  async function changeStatus(newStatus: string) {
    const token = (await getToken()) || undefined;
    const updated = await api.patch(`/campaigns/${params.id}/status`, { status: newStatus }, token);
    setCampaign((prev) => prev ? { ...prev, status: updated.status } : prev);
  }

  async function updateVariant(vid: string, data: Partial<Variant>) {
    const token = (await getToken()) || undefined;
    await api.put(`/campaigns/${params.id}/variants/${vid}`, data, token);
    await loadCampaign();
  }

  async function addVariant() {
    const token = (await getToken()) || undefined;
    const existingRoles = campaign?.variants.map((v) => v.role) || [];
    const nextRole = ["variant_a", "variant_b", "variant_c", "variant_d"].find(
      (r) => !existingRoles.includes(r),
    );
    if (!nextRole) return;
    await api.post(`/campaigns/${params.id}/variants`, { role: nextRole }, token);
    await loadCampaign();
  }

  async function removeVariant(vid: string) {
    const token = (await getToken()) || undefined;
    await api.delete(`/campaigns/${params.id}/variants/${vid}`, token);
    await loadCampaign();
  }

  async function deleteCampaign() {
    const token = (await getToken()) || undefined;
    await api.delete(`/campaigns/${params.id}`, token);
    router.push("/campaigns");
  }

  async function generateScripts() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    const token = (await getToken()) || undefined;
    try {
      await api.post(`/campaigns/${params.id}/generate`, { prompt: aiPrompt }, token);
      await loadCampaign();
      setAiPrompt("");
    } catch {
      setError("AI generation failed. Check your API key.");
    }
    setAiLoading(false);
  }

  const totalWeight = campaign?.variants.reduce((sum, v) => sum + v.weight, 0) || 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <p className="text-destructive">{error || "Campaign not found"}</p>
        <Button variant="outline" onClick={() => router.push("/campaigns")}>Back to Campaigns</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <button onClick={() => router.push("/campaigns")} className="mb-4 text-sm text-muted-foreground hover:text-foreground">
          ← Campaigns
        </button>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{campaign.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {campaign.goal || "No goal set"} · Status: {campaign.status}
              {campaign.start_date && ` · ${new Date(campaign.start_date).toLocaleDateString()}`}
              {campaign.end_date && ` — ${new Date(campaign.end_date).toLocaleDateString()}`}
            </p>
          </div>
          <div className="flex gap-2">
            {STATUS_ACTIONS[campaign.status]?.map((action) => (
              <Button key={action} size="sm" onClick={() => changeStatus(action)}>
                {action === "active" ? "Activate" : action === "paused" ? "Pause" : action === "completed" ? "Complete" : action}
              </Button>
            ))}
            {campaign.status === "draft" && (
              <Button size="sm" variant="destructive" onClick={deleteCampaign}>Delete</Button>
            )}
          </div>
        </div>

        {campaign.notes && (
          <Card className="mb-6 p-4">
            <p className="text-sm text-muted-foreground">{campaign.notes}</p>
          </Card>
        )}

        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">AI Script Generator</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe your ad idea... (e.g. 'Summer sale 50% off, upbeat mood')"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => e.key === "Enter" && generateScripts()}
            />
            <Button onClick={generateScripts} disabled={aiLoading || !aiPrompt.trim()}>
              {aiLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Audio Variants</h2>
            {campaign.variants.length < 5 && (
              <Button size="sm" variant="outline" onClick={addVariant}>+ Add Variant</Button>
            )}
          </div>

          <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
            {campaign.variants.map((v) => (
              <div
                key={v.role}
                className="float-left h-full transition-all"
                style={{
                  width: `${(v.weight / (totalWeight || 1)) * 100}%`,
                  backgroundColor: v.role === "control" ? "#6366F1" : v.role === "variant_a" ? "#10B981" : v.role === "variant_b" ? "#F59E0B" : v.role === "variant_c" ? "#F43F5E" : "#8B5CF6",
                }}
              />
            ))}
          </div>

          <div className="space-y-3">
            {campaign.variants.map((v) => (
              <VariantEditor
                key={v.id}
                variant={v}
                onUpdate={(data) => updateVariant(v.id, data)}
                onRemove={() => removeVariant(v.id)}
                canRemove={campaign.variants.length > 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VariantEditor({
  variant,
  onUpdate,
  onRemove,
  canRemove,
}: {
  variant: Variant;
  onUpdate: (data: Partial<Variant>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            variant.role === "control" ? "bg-primary/20 text-primary"
            : variant.role === "variant_a" ? "bg-success/20 text-success"
            : variant.role === "variant_b" ? "bg-warning/20 text-warning"
            : variant.role === "variant_c" ? "bg-destructive/20 text-destructive"
            : "bg-purple-500/20 text-purple-400"
          }`}>
            {ROLE_LABELS[variant.role] || variant.role}
          </span>
          {variant.is_generated && (
            <span className="text-xs text-muted-foreground">AI generated</span>
          )}
        </div>
        {canRemove && (
          <button onClick={onRemove} className="text-xs text-destructive hover:text-destructive/80">
            Remove
          </button>
        )}
      </div>

      <textarea
        value={variant.script}
        onChange={(e) => onUpdate({ script: e.target.value })}
        rows={3}
        className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Enter script text..."
      />

      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Weight:</label>
        <input
          type="range"
          min={0}
          max={100}
          value={variant.weight}
          onChange={(e) => onUpdate({ weight: parseInt(e.target.value) })}
          className="flex-1 accent-primary"
        />
        <span className="w-8 text-right text-xs text-muted-foreground">{variant.weight}%</span>
      </div>
    </Card>
  );
}
