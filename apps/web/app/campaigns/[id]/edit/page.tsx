"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface CampaignData {
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  notes: string;
}

export default function EditCampaignPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [form, setForm] = useState<CampaignData>({
    name: "", goal: "", start_date: "", end_date: "", notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadCampaign(); }, []);

  async function loadCampaign() {
    const token = (await getToken()) || undefined;
    try {
      const data = await api.get(`/campaigns/${params.id}`, token);
      setForm({
        name: data.name,
        goal: data.goal || "",
        start_date: data.start_date ? data.start_date.slice(0, 10) : "",
        end_date: data.end_date ? data.end_date.slice(0, 10) : "",
        notes: data.notes || "",
      });
    } catch {
      setError("Campaign not found");
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");

    try {
      const token = (await getToken()) || undefined;
      await api.put(`/campaigns/${params.id}`, form, token);
      router.push(`/campaigns/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => router.back()} className="mb-4 text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Edit Campaign</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">Name</label>
            <input id="name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-foreground">Goal</label>
            <select id="goal" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Select...</option>
              <option value="awareness">Brand Awareness</option>
              <option value="conversion">Conversion</option>
              <option value="retention">Retention</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start" className="block text-sm font-medium text-foreground">Start</label>
              <input id="start" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="end" className="block text-sm font-medium text-foreground">End</label>
              <input id="end" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground">Notes</label>
            <textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={() => router.back()} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
