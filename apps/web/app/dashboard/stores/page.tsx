"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface StorePerf {
  id: string;
  name: string;
  location: string;
  plays: number;
  listeners: number;
  nodeStatus: string;
  lastSeen: string | null;
}

export default function StorePerformancePage() {
  const { getToken, isSignedIn } = useAuth();
  const [stores, setStores] = useState<StorePerf[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadData();
  }, [isSignedIn]);

  async function loadData() {
    const token = (await getToken()) || undefined;
    const res = await api.get("/api/analytics/stores", token);
    setStores((res as { stores: StorePerf[] }).stores ?? []);
    setLoading(false);
  }

  const totalPlays = stores.reduce((a, s) => a + s.plays, 0);
  const online = stores.filter((s) => s.nodeStatus === "online").length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Store Performance</h1>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stores.length}</p>
            <p className="text-xs text-muted-foreground">Total Stores</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{online}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalPlays.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Plays</p>
          </Card>
        </div>

        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        ) : stores.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">No stores configured yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stores.map((store) => (
              <Card key={store.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-foreground">{store.name}</p>
                  <p className="text-xs text-muted-foreground">{store.location}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{store.plays}</p>
                    <p className="text-[10px] text-muted-foreground">plays</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{store.listeners}</p>
                    <p className="text-[10px] text-muted-foreground">listeners</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${
                      store.nodeStatus === "online" ? "bg-success" : "bg-destructive"
                    }`} />
                    <span className="text-xs text-muted-foreground">
                      {store.nodeStatus}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
