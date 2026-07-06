"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface EdgeNode {
  id: string;
  name: string;
  platform: string;
  is_online: boolean;
  last_seen_at: string | null;
  firmware_version: string | null;
}

export default function EdgeNodesPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [nodes, setNodes] = useState<EdgeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadNodes();
  }, [isSignedIn]);

  async function loadNodes() {
    const token = (await getToken()) || undefined;
    const data = await api.get("/edge-nodes", token);
    setNodes(data.nodes ?? []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Edge Nodes</h1>
          <Button variant="outline" onClick={() => router.push("/sync")}>Sync Dashboard</Button>
        </div>

        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        ) : nodes.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">No edge nodes registered</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Edge nodes appear here after the APK registers with the server
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {nodes.map((node) => (
              <Card
                key={node.id}
                className="cursor-pointer p-4 transition-all hover:border-primary/50"
                onClick={() => router.push(`/settings/edge-nodes/${node.id}`)}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${node.is_online ? "bg-success" : "bg-destructive"}`} />
                    <h3 className="font-medium text-foreground">{node.name}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{node.platform}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{node.is_online ? "Online" : "Offline"}</span>
                  {node.firmware_version && <span>v{node.firmware_version}</span>}
                  {node.last_seen_at && (
                    <span>Last seen: {new Date(node.last_seen_at).toLocaleDateString()}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
