"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface McpAction {
  id: string;
  action: string;
  label: string;
  enabled: boolean;
}

export default function McpPage() {
  const { getToken, isSignedIn } = useAuth();
  const [actions, setActions] = useState<McpAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadActions();
  }, [isSignedIn]);

  async function loadActions() {
    const token = (await getToken()) || undefined;
    const data = await api.get("/mcp/actions", token);
    setActions(data.actions ?? []);
    setLoading(false);
  }

  async function toggleAction(id: string, enabled: boolean) {
    const token = (await getToken()) || undefined;
    await api.put(`/mcp/actions/${id}`, { enabled }, token);
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, enabled } : a));
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">MCP Actions</h1>
        <p className="mb-6 text-sm text-muted-foreground">Enable or disable MCP server actions. Disabled actions will be blocked.</p>

        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        ) : (
          <div className="space-y-2">
            {actions.map((a) => (
              <Card key={a.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.action}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={a.enabled}
                    onChange={(e) => toggleAction(a.id, e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-card after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
                </label>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
