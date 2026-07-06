"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

type Segment = { id: string; label: string; description: string };

const STEPS = [
  "Brand & Creative",
  "Upload Audio",
  "Store Targeting",
  "Schedule & Budget",
  "Estimate",
  "Submit",
];

export default function NewAdCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [advertiserId, setAdvertiserId] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [form, setForm] = useState({
    name: "",
    script: "",
    targetSegments: [] as string[],
    frequencyCap: 2,
    cpm: 10,
    budget: 100,
  });
  const [estimate, setEstimate] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const aid = localStorage.getItem("advertiserId");
    if (!aid) { router.push("/advertiser/register"); return; }
    setAdvertiserId(aid);
    api.get("/api/advertisers/segments").then((data) => setSegments((data as { segments: Segment[] }).segments ?? []));
  }, []);

  function toggleSegment(id: string) {
    setForm((f) => ({
      ...f,
      targetSegments: f.targetSegments.includes(id)
        ? f.targetSegments.filter((s) => s !== id)
        : [...f.targetSegments, id],
    }));
  }

  async function handleEstimate() {
    if (!estimate) {
      const data = await api.get(`/api/advertisers/campaigns/placeholder/estimate`);
      setEstimate((data as { estimate: Record<string, unknown> }).estimate);
    }
    setStep(4);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const data = await api.post("/api/advertisers/campaigns", { ...form, advertiserId });
      const campaign = (data as { campaign: { id: string } }).campaign;
      router.push(`/advertiser/campaigns/${campaign.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Brand & Creative</h2>
              <div>
                <label className="block text-sm font-medium text-foreground">Campaign Name</label>
                <input
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Script</label>
                <textarea
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                  value={form.script}
                  onChange={(e) => setForm({ ...form, script: e.target.value })}
                />
              </div>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setStep(1)}>
                Next: Upload Audio
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Upload Audio</h2>
              <p className="text-sm text-muted-foreground">Upload an MP3 file (max 50MB). We support WAV, MP3, and OGG.</p>
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                <input type="file" accept="audio/*" className="hidden" />
                <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
              </div>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setStep(2)}>
                Next: Store Targeting
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Store Targeting</h2>
              <p className="text-sm text-muted-foreground">Select audience segments based on POS behavioral data:</p>
              <div className="grid grid-cols-1 gap-3">
                {segments.map((seg) => (
                  <label
                    key={seg.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                      form.targetSegments.includes(seg.id) ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.targetSegments.includes(seg.id)}
                      onChange={() => toggleSegment(seg.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{seg.label}</p>
                      <p className="text-xs text-muted-foreground">{seg.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setStep(3)}>
                Next: Schedule & Budget
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Schedule & Budget</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Budget ($)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">CPM ($)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                    value={form.cpm}
                    onChange={(e) => setForm({ ...form, cpm: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Frequency Cap</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                    value={form.frequencyCap}
                    onChange={(e) => setForm({ ...form, frequencyCap: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={handleEstimate}>
                Estimate Reach
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Reach Estimate</h2>
              {estimate && (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(estimate).map(([key, val]) => (
                    <div key={key} className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">{key.replace(/([A-Z])/g, " $1")}</p>
                      <p className="text-lg font-bold text-foreground">{String(val)}</p>
                    </div>
                  ))}
                </div>
              )}
              <button className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => setStep(5)}>
                Next: Submit
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Submit Campaign</h2>
              <div className="rounded-lg border border-border p-4 text-sm text-foreground">
                <p><strong>Name:</strong> {form.name}</p>
                <p><strong>Budget:</strong> ${form.budget}</p>
                <p><strong>CPM:</strong> ${form.cpm}</p>
                <p><strong>Frequency Cap:</strong> {form.frequencyCap}</p>
                <p><strong>Segments:</strong> {form.targetSegments.length} selected</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Campaign"}
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
