"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_builtin: boolean;
}

interface ReportInstance {
  id: string;
  template_id: string;
  status: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  ceo: "CEO",
  technical: "Technical",
  store_admin: "Store Admin",
  advertiser: "Advertiser",
  custom: "Custom",
};

const CATEGORY_COLORS: Record<string, string> = {
  ceo: "from-violet-500 to-purple-600",
  technical: "from-blue-500 to-cyan-600",
  store_admin: "from-emerald-500 to-teal-600",
  advertiser: "from-amber-500 to-orange-600",
  custom: "from-gray-500 to-slate-600",
};

export default function ReportsPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [instances, setInstances] = useState<ReportInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadData();
  }, [isSignedIn]);

  async function loadData() {
    const token = (await getToken()) || undefined;
    const [tplData, instData] = await Promise.all([
      api.get("/reports/templates", token),
      api.get("/reports/instances", token),
    ]);
    setTemplates(tplData.templates ?? []);
    setInstances(instData.instances ?? []);
    setLoading(false);
  }

  async function generateReport(templateId: string) {
    const token = (await getToken()) || undefined;
    setGenerating(templateId);
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      await api.post("/reports/generate", {
        templateId,
        periodStart: weekAgo.toISOString().split("T")[0],
        periodEnd: now.toISOString().split("T")[0],
      }, token);
      await loadData();
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-6xl">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <Button variant="outline" onClick={() => router.push("/reports/templates")}>
            Manage Templates
          </Button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${CATEGORY_COLORS[tpl.category] ?? "from-gray-500 to-slate-600"}`} />
              <div className="p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {CATEGORY_LABELS[tpl.category] ?? tpl.category}
                  </span>
                  {tpl.is_builtin && (
                    <span className="text-[10px] text-muted-foreground">BUILTIN</span>
                  )}
                </div>
                <h3 className="mb-1 font-medium text-foreground">{tpl.name}</h3>
                <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => generateReport(tpl.id)}
                    disabled={generating === tpl.id}
                  >
                    {generating === tpl.id ? "Generating..." : "Generate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/reports/templates/${tpl.id}/edit`)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <h2 className="mb-3 text-lg font-medium">Generated Reports</h2>
          {instances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports generated yet</p>
          ) : (
            <div className="space-y-2">
              {instances.map((inst) => {
                const tpl = templates.find((t) => t.id === inst.template_id);
                return (
                  <div
                    key={inst.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted/80"
                    onClick={() => router.push(`/reports/instances/${inst.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${inst.status === "ready" ? "bg-success" : inst.status === "failed" ? "bg-destructive" : "bg-muted-foreground"}`} />
                      <span className="text-sm text-foreground">{tpl?.name ?? "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">{inst.period_start} — {inst.period_end}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        inst.status === "ready" ? "bg-success/20 text-success" :
                        inst.status === "failed" ? "bg-destructive/20 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {inst.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
