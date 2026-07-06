"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface DeprovisionStatus {
  step: string;
  suspended_at: string | null;
  deletion_scheduled_at: string | null;
  days_remaining: number;
  can_reactivate: boolean;
}

const STEP_LABELS: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  grace: "Grace Period",
  warning: "Warning",
  deleting: "Deleting",
  deleted: "Deleted",
};

const STEP_COLORS: Record<string, string> = {
  active: "bg-success/20 text-success",
  suspended: "bg-amber-500/20 text-amber-500",
  grace: "bg-warning/20 text-warning",
  warning: "bg-destructive/20 text-destructive",
  deleting: "bg-destructive/20 text-destructive",
  deleted: "bg-muted text-muted-foreground",
};

const STEP_ORDER = ["active", "suspended", "grace", "warning", "deleting", "deleted"];

export default function DeprovisionPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<DeprovisionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadStatus();
  }, [isSignedIn]);

  async function loadStatus() {
    const token = (await getToken()) || undefined;
    const data = await api.get("/tenants/deprovision-status", token);
    setStatus(data);
    setLoading(false);
  }

  async function handleSuspend() {
    const token = (await getToken()) || undefined;
    setProcessing(true);
    try {
      await api.post("/tenants/suspend", {}, token);
      await loadStatus();
    } finally {
      setProcessing(false);
      setConfirmSuspend(false);
    }
  }

  async function handleReactivate() {
    const token = (await getToken()) || undefined;
    setProcessing(true);
    try {
      await api.post("/tenants/reactivate", {}, token);
      await loadStatus();
    } finally {
      setProcessing(false);
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

  const currentStepIndex = STEP_ORDER.indexOf(status?.step ?? "active");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">De-provisioning</h1>

        <Card className="mb-6 p-4">
          <h2 className="mb-4 text-lg font-medium">Status</h2>

          <div className="mb-6 flex items-center justify-between gap-2">
            {STEP_ORDER.map((step, i) => (
              <div key={step} className="flex flex-1 flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  i < currentStepIndex ? "bg-destructive/20 text-destructive" :
                  i === currentStepIndex ? STEP_COLORS[step] :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                <span className={`mt-1 text-[10px] ${
                  i === currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Current Step</p>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${STEP_COLORS[status?.step ?? "active"] ?? ""}`}>
                {STEP_LABELS[status?.step ?? "active"] ?? status?.step}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Days Remaining</p>
              <p className={`text-sm font-medium mt-1 ${(status?.days_remaining ?? 0) <= 7 ? "text-destructive" : "text-foreground"}`}>
                {status?.days_remaining ?? 37} days
              </p>
            </div>
            {status?.suspended_at && (
              <div>
                <p className="text-xs text-muted-foreground">Suspended</p>
                <p className="text-sm text-foreground mt-1">{new Date(status.suspended_at).toLocaleDateString()}</p>
              </div>
            )}
            {status?.deletion_scheduled_at && (
              <div>
                <p className="text-xs text-muted-foreground">Deleted</p>
                <p className="text-sm text-foreground mt-1">{new Date(status.deletion_scheduled_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {status?.step === "active" && !confirmSuspend && (
              <Button variant="destructive" onClick={() => setConfirmSuspend(true)}>
                Suspend Tenant
              </Button>
            )}
            {confirmSuspend && (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleSuspend} disabled={processing}>
                  {processing ? "Processing..." : "Confirm Suspend"}
                </Button>
                <Button variant="outline" onClick={() => setConfirmSuspend(false)}>Cancel</Button>
              </div>
            )}
            {status?.can_reactivate && (
              <Button onClick={handleReactivate} disabled={processing}>
                {processing ? "Processing..." : "Reactivate"}
              </Button>
            )}
          </div>
          {confirmSuspend && (
            <p className="mt-2 text-xs text-destructive">
              Warning: Your tenant will be suspended and all data will be deleted in 37 days.
            </p>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-sm font-medium text-foreground">Timeline</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="font-mono text-xs">Day 1</span> Tenant suspended. Syncs and playback disabled.</li>
            <li className="flex gap-2"><span className="font-mono text-xs">Day 7</span> Grace period email: &quot;7 days to reactivate&quot;</li>
            <li className="flex gap-2"><span className="font-mono text-xs">Day 30</span> Warning email: &quot;7 days until total deletion&quot;</li>
            <li className="flex gap-2"><span className="font-mono text-xs">Day 37</span> All data permanently deleted.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
