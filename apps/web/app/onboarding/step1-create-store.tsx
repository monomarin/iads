"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Props {
  onComplete: (data: Record<string, unknown>) => void;
}

export function Step1CreateStore({ onComplete }: Props) {
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Store name is required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const token = (await getToken()) || undefined;
      await api.post("/stores", { name, address }, token);
      onComplete({ name, address });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create store");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Create your store</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about your store to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Store name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="My Store"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-foreground">
            Address (optional)
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="123 Main St, City"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Continue"}
        </Button>
      </form>
    </div>
  );
}
