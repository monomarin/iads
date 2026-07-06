"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Audit {
  id: string;
  campaign_id: string;
  check_type: string;
  play_count: number;
  status: string;
  issues: Array<{ variantId: string; issue: string }>;
  checked_at: string;
  campaigns: { name: string };
}

export default function AudioAuditPage() {
  const { getToken, isSignedIn } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadAudits();
  }, [isSignedIn]);

  async function loadAudits() {
    const token = (await getToken()) || undefined;
    const data = await api.get("/audio-audit", token);
    setAudits(data.audits ?? []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Audio Audit</h1>

        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        ) : audits.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">No audits yet. Run a check on a campaign.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${a.status === "passed" ? "bg-success" : "bg-destructive"}`} />
                    <span className="font-medium text-foreground">{a.campaigns?.name ?? "Unknown"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(a.checked_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{a.check_type}</span>
                  <span>{a.play_count} plays</span>
                  <span className={a.status === "passed" ? "text-success" : "text-destructive"}>{a.status}</span>
                </div>
                {a.issues?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {a.issues.map((issue, i) => (
                      <p key={i} className="text-xs text-destructive">• {issue.issue}</p>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
