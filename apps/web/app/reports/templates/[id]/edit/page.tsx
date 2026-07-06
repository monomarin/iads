"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Widget {
  id: string;
  title: string;
  type: string;
  metric: string;
  span: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  widgets: Widget[];
}

const WIDGET_TYPES = ["number", "bar", "line", "pie", "table"];
const METRICS = [
  "total_plays", "active_campaigns", "revenue", "stores_online",
  "sync_success_rate", "edge_uptime", "error_count", "storage_used",
  "plays_per_hour", "compliance_rate", "top_tracks", "impressions",
  "ab_test_results", "roi",
];

export default function EditTemplatePage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !id) { router.push("/sign-in"); return; }
    loadTemplate();
  }, [isSignedIn, id]);

  async function loadTemplate() {
    const token = (await getToken()) || undefined;
    const data = await api.get(`/reports/templates/${id}`, token);
    const tpl = data.template;
    setName(tpl.name);
    setDescription(tpl.description ?? "");
    setSections(tpl.config?.sections ?? []);
    setLoading(false);
  }

  function addSection() {
    setSections((prev) => [...prev, {
      id: crypto.randomUUID(),
      title: "New Section",
      widgets: [],
    }]);
  }

  function updateSection(sectionId: string, field: string, value: string) {
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, [field]: value } : s));
  }

  function removeSection(sectionId: string) {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }

  function addWidget(sectionId: string) {
    setSections((prev) => prev.map((s) => s.id === sectionId ? {
      ...s,
      widgets: [...s.widgets, { id: crypto.randomUUID(), title: "New Widget", type: "number", metric: "total_plays", span: 1 }],
    } : s));
  }

  function updateWidget(sectionId: string, widgetId: string, field: string, value: string | number) {
    setSections((prev) => prev.map((s) => s.id === sectionId ? {
      ...s,
      widgets: s.widgets.map((w) => w.id === widgetId ? { ...w, [field]: value } : w),
    } : s));
  }

  function removeWidget(sectionId: string, widgetId: string) {
    setSections((prev) => prev.map((s) => s.id === sectionId ? {
      ...s,
      widgets: s.widgets.filter((w) => w.id !== widgetId),
    } : s));
  }

  async function save() {
    const token = (await getToken()) || undefined;
    setSaving(true);
    try {
      await api.put(`/reports/templates/${id}`, {
        name,
        description,
        config: { sections },
      }, token);
      router.push("/reports");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Edit Template</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/reports")}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </div>

        <Card className="mb-6 p-4">
          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted-foreground">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              rows={2}
            />
          </div>
        </Card>

        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.id} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, "title", e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground"
                />
                <Button size="sm" variant="destructive" onClick={() => removeSection(section.id)}>Remove</Button>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {section.widgets.map((widget) => (
                  <div key={widget.id} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <input
                        type="text"
                        value={widget.title}
                        onChange={(e) => updateWidget(section.id, widget.id, "title", e.target.value)}
                        className="w-full bg-transparent text-xs font-medium text-foreground outline-none"
                      />
                      <button
                        onClick={() => removeWidget(section.id, widget.id)}
                        className="ml-1 text-xs text-destructive"
                      >
                        x
                      </button>
                    </div>
                    <select
                      value={widget.type}
                      onChange={(e) => updateWidget(section.id, widget.id, "type", e.target.value)}
                      className="mb-1 w-full rounded bg-background px-1 py-0.5 text-xs text-foreground"
                    >
                      {WIDGET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={widget.metric}
                      onChange={(e) => updateWidget(section.id, widget.id, "metric", e.target.value)}
                      className="w-full rounded bg-background px-1 py-0.5 text-xs text-foreground"
                    >
                      {METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">Span:</span>
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          onClick={() => updateWidget(section.id, widget.id, "span", n)}
                          className={`px-1.5 py-0.5 text-[10px] rounded ${
                            widget.span === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addWidget(section.id)}
                  className="flex items-center justify-center rounded-lg border-2 border-dashed border-border p-3 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  + Add Widget
                </button>
              </div>
            </Card>
          ))}
        </div>

        <Button variant="outline" className="mt-4 w-full" onClick={addSection}>
          + Add Section
        </Button>
      </div>
    </div>
  );
}
