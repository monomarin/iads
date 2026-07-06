"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface SafetyLog {
  id: string;
  variant_id: string;
  status: string;
  score: number;
  layers: Array<{ layer: string; passed: boolean; score: number; details: string[] }>;
  summary: string;
  created_at: string;
  audio_variants: { role: string; script: string };
  campaigns: { name: string };
}

const LAYER_LABELS: Record<string, string> = {
  transcription_match: "Transcription Match",
  blacklist: "Blacklist",
  tone_classifier: "Tone Classifier",
  bias_audit: "Bias Audit",
  legal_compliance: "Legal Compliance",
};

export default function BrandSafetyPage() {
  const { getToken, isSignedIn } = useAuth();
  const [logs, setLogs] = useState<SafetyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadLogs();
  }, [isSignedIn]);

  async function loadLogs() {
    const token = (await getToken()) || undefined;
    const data = await api.get("/brand-safety/logs", token);
    setLogs(data.logs ?? []);
    setLoading(false);
  }

  const passed = logs.filter((l) => l.status === "passed").length;
  const flagged = logs.filter((l) => l.status === "flagged").length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Brand Safety</h1>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total Audits</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{passed}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{flagged}</p>
            <p className="text-xs text-muted-foreground">Flagged</p>
          </Card>
        </div>

        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        ) : logs.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">No audits yet. Run a brand safety check on a campaign variant.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${log.status === "passed" ? "bg-success" : "bg-destructive"}`} />
                    <span className="font-medium text-foreground">
                      {log.campaigns?.name ?? "Unknown"} / {log.audio_variants?.role ?? "?"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-foreground">{log.score}/100</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      log.status === "passed" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {log.layers.map((layer) => (
                    <div
                      key={layer.layer}
                      className={`rounded-lg border p-2 ${
                        layer.passed ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      <p className="text-[10px] font-medium text-muted-foreground">
                        {LAYER_LABELS[layer.layer] ?? layer.layer}
                      </p>
                      <p className={`text-sm font-bold ${layer.passed ? "text-success" : "text-destructive"}`}>
                        {layer.score}
                      </p>
                      {layer.details.map((d, i) => (
                        <p key={i} className="text-[9px] text-muted-foreground leading-tight">{d}</p>
                      ))}
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {log.summary} · {new Date(log.created_at).toLocaleString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
