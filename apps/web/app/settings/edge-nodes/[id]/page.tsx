"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface EdgeNode {
  id: string;
  store_id: string;
  name: string;
  platform: string;
  device_token: string | null;
  fcm_token: string | null;
  firmware_version: string | null;
  settings: Record<string, unknown>;
  is_online: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function EdgeNodeDetailPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [node, setNode] = useState<EdgeNode | null>(null);
  const [sending, setSending] = useState(false);
  const [commandLog, setCommandLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn || !id) { router.push("/sign-in"); return; }
    loadNode();
  }, [isSignedIn, id]);

  async function loadNode() {
    const token = (await getToken()) || undefined;
    const data = await api.get(`/edge-nodes?storeId=all`, token);
    const found = (data.nodes ?? []).find((n: EdgeNode) => n.id === id);
    setNode(found ?? null);
    setLoading(false);
  }

  async function sendCommand(command: string) {
    const token = (await getToken()) || undefined;
    setSending(true);
    try {
      await api.post(`/edge-nodes/${id}/push`, { command }, token);
      setCommandLog((prev) => [...prev, `${new Date().toLocaleTimeString()} — Sent: ${command}`]);
    } catch (err) {
      setCommandLog((prev) => [...prev, `${new Date().toLocaleTimeString()} — Failed: ${command}`]);
    } finally {
      setSending(false);
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

  if (!node) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl text-center mt-20">
          <p className="text-muted-foreground">Edge node not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/settings/edge-nodes")}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">{node.name}</h1>
          <Button variant="outline" onClick={() => router.push("/settings/edge-nodes")}>Back</Button>
        </div>

        <Card className="mb-6 p-4">
          <h2 className="mb-3 text-lg font-medium">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className={`text-sm font-medium ${node.is_online ? "text-success" : "text-destructive"}`}>
                {node.is_online ? "Online" : "Offline"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Platform</p>
              <p className="text-sm text-foreground">{node.platform}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Firmware</p>
              <p className="text-sm text-foreground">{node.firmware_version ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Seen</p>
              <p className="text-sm text-foreground">
                {node.last_seen_at ? new Date(node.last_seen_at).toLocaleString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">FCM Token</p>
              <p className="text-sm font-mono text-foreground">{node.fcm_token ? `${node.fcm_token.slice(0, 20)}...` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registered</p>
              <p className="text-sm text-foreground">{new Date(node.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>

        <Card className="mb-6 p-4">
          <h2 className="mb-3 text-lg font-medium">Commands</h2>
          <div className="flex flex-wrap gap-2">
            {["play", "pause", "skip", "volume_up", "volume_down", "reboot"].map((cmd) => (
              <Button
                key={cmd}
                variant="outline"
                size="sm"
                onClick={() => sendCommand(cmd)}
                disabled={sending}
              >
                {cmd.replace("_", " ")}
              </Button>
            ))}
          </div>
          {commandLog.length > 0 && (
            <div className="mt-4 space-y-1">
              {commandLog.map((entry, i) => (
                <p key={i} className="text-xs text-muted-foreground">{entry}</p>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
