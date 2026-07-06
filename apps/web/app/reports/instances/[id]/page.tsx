"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface ReportInstance {
  id: string;
  template_id: string;
  period_start: string;
  period_end: string;
  data: Record<string, unknown>;
  status: string;
  format: string;
  generated_at: string;
  created_at: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  config: { sections: Array<{ title: string; widgets: Array<{ id: string; title: string; type: string; metric: string; span: number }> }> };
}

function WidgetCard({ widget, data }: { widget: { id: string; title: string; type: string; metric: string; span: number }; data: unknown }) {
  return (
    <Card className={`p-4 ${widget.span > 1 ? `lg:col-span-${widget.span}` : ""}`}>
      <h3 className="mb-2 text-sm font-medium text-foreground">{widget.title}</h3>
      {widget.type === "number" ? (
        <p className="text-3xl font-bold text-primary">{String(data ?? "—")}</p>
      ) : widget.type === "table" && Array.isArray(data) ? (
        <div className="space-y-1">
          {data.map((row: Record<string, unknown>, i: number) => (
            <div key={i} className="flex justify-between text-sm text-foreground">
              <span>{String(row.name ?? row.label ?? row.period ?? "")}</span>
              <span className="font-mono text-muted-foreground">{String(row.value ?? row.plays ?? row.roi ?? row.rank ?? "")}</span>
            </div>
          ))}
        </div>
      ) : widget.type === "pie" && Array.isArray(data) ? (
        <div className="space-y-2">
          {data.map((slice: Record<string, unknown>, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: [`#6366F1`, `#22C55E`, `#F59E0B`, `#EF4444`][i] ?? `#6366F1` }} />
              <span className="text-sm text-foreground">{String(slice.label ?? "")}</span>
              <span className="ml-auto text-sm text-muted-foreground">{String(slice.value ?? "")}%</span>
            </div>
          ))}
        </div>
      ) : (
        <pre className="overflow-auto text-xs text-muted-foreground">{JSON.stringify(data, null, 2)}</pre>
      )}
      <p className="mt-2 text-[10px] text-muted-foreground">{widget.type} · {widget.metric}</p>
    </Card>
  );
}

export default function ReportInstancePage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [instance, setInstance] = useState<ReportInstance | null>(null);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn || !id) { router.push("/sign-in"); return; }
    loadInstance();
  }, [isSignedIn, id]);

  async function loadInstance() {
    const token = (await getToken()) || undefined;
    const data = await api.get(`/reports/instances/${id}`, token);
    setInstance(data.instance);
    setTemplate(data.template);
    setLoading(false);
  }

  async function exportReport() {
    const win = window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/instances/${id}/export`, "_blank");
    if (win) win.focus();
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

  if (!instance || !template) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl text-center mt-20">
          <p className="text-muted-foreground">Report not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/reports")}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{template.name}</h1>
            <p className="text-sm text-muted-foreground">
              {instance.period_start} — {instance.period_end}
              {instance.generated_at && ` · Generated ${new Date(instance.generated_at).toLocaleString()}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportReport}>Export</Button>
            <Button variant="outline" onClick={() => router.push("/reports")}>Back</Button>
          </div>
        </div>

        {instance.status === "generating" ? (
          <div className="mt-20 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Generating report...</p>
          </div>
        ) : instance.status === "failed" ? (
          <Card className="p-6 text-center">
            <p className="text-destructive">Report generation failed</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {template.config.sections.map((section) => (
              <div key={section.title}>
                <h2 className="mb-3 text-lg font-medium text-foreground">{section.title}</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {section.widgets.map((widget) => (
                    <WidgetCard
                      key={widget.id}
                      widget={widget}
                      data={instance.data[widget.metric]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
