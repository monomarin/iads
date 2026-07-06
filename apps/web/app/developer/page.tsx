"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function DeveloperPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    loadKeys();
  }, [isSignedIn]);

  async function loadKeys() {
    const token = (await getToken()) || undefined;
    const res = await api.get("/api/developer/keys", token);
    setKeys((res as { keys: ApiKey[] }).keys ?? []);
    setLoading(false);
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    const token = (await getToken()) || undefined;
    const res = await api.post("/api/developer/keys", { name: newKeyName, permissions: ["read"] }, token);
    const { rawKey } = res as { rawKey: string };
    setCreatedRawKey(rawKey);
    setNewKeyName("");
    loadKeys();
  }

  async function revokeKey(id: string) {
    const token = (await getToken()) || undefined;
    await api.delete(`/api/developer/keys/${id}`, token);
    loadKeys();
  }

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Developer Portal</h1>
          <button
            onClick={() => router.push("/developer/webhooks")}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent"
          >
            Webhooks
          </button>
        </div>

        <Card className="mb-6 p-4">
          <h2 className="mb-3 font-semibold text-foreground">Create API Key</h2>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
              placeholder="Key name (e.g., Production)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <button
              onClick={createKey}
              disabled={!newKeyName.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </Card>

        {createdRawKey && (
          <Card className="mb-6 border-warning p-4">
            <p className="text-sm font-medium text-foreground">API Key Generated</p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">{createdRawKey}</p>
            <p className="mt-1 text-xs text-destructive">Copy this key now. It will not be shown again.</p>
            <button
              onClick={() => { navigator.clipboard.writeText(createdRawKey); setCreatedRawKey(null); }}
              className="mt-2 rounded-lg bg-primary px-3 py-1 text-xs text-primary-foreground"
            >
              Copy & Dismiss
            </button>
          </Card>
        )}

        <div className="space-y-2">
          {keys.map((key) => (
            <Card key={key.id} className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{key.name}</p>
                  <span className={`h-2 w-2 rounded-full ${key.isActive ? "bg-success" : "bg-destructive"}`} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {(key.permissions as string[]).join(", ")} · {key.lastUsedAt ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : "Never used"}
                </p>
              </div>
              <button
                onClick={() => revokeKey(key.id)}
                className="rounded-lg border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
              >
                Revoke
              </button>
            </Card>
          ))}
          {keys.length === 0 && <div className="mt-10 text-center text-muted-foreground">No API keys yet.</div>}
        </div>
      </div>
    </div>
  );
}
