"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@raemonorepo/ui";
import { api } from "@/lib/api";

export default function NewCampaignPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Campaign name is required"); return; }
    setSaving(true);
    setError("");

    try {
      const token = (await getToken()) || undefined;
      const campaign = await api.post("/campaigns", {
        store_id: "00000000-0000-0000-0000-000000000003",
        name,
        goal: goal || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        notes: notes || undefined,
      }, token);
      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>

        <h1 className="mb-6 text-2xl font-semibold text-foreground">New Campaign</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">Campaign name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Summer Sale Audio" autoFocus />
          </div>

          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-foreground">Goal</label>
            <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select goal...</option>
              <option value="awareness">Brand Awareness</option>
              <option value="conversion">Conversion</option>
              <option value="retention">Customer Retention</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start" className="block text-sm font-medium text-foreground">Start date</label>
              <input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="end" className="block text-sm font-medium text-foreground">End date</label>
              <input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground">Notes (optional)</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Campaign objectives, target audience..." />
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={() => router.back()} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? "Creating..." : "Create Campaign"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
