"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

export default function AdvertiserRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", brandName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/advertisers/register", form);
      const aid = (res as { advertiser: { id: string } }).advertiser.id;
      localStorage.setItem("advertiserId", aid);
      router.push(`/advertiser/campaigns`);
    } catch {
      setError("Error registering. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="mb-6 text-xl font-semibold text-foreground">Register Your Brand</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Contact Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Brand Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Registering…" : "Register"}
          </button>
        </form>
      </Card>
    </div>
  );
}
