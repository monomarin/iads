"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  is_builtin: boolean;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  ceo: "CEO",
  technical: "Technical",
  store_admin: "Store Admin",
  advertiser: "Advertiser",
  custom: "Custom",
};

export default function ReportTemplatesPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadTemplates();
  }, [isSignedIn]);

  async function loadTemplates() {
    const token = (await getToken()) || undefined;
    const data = await api.get("/reports/templates", token);
    setTemplates(data.templates ?? []);
    setLoading(false);
  }

  async function deleteTemplate(id: string) {
    const token = (await getToken()) || undefined;
    await api.delete(`/reports/templates/${id}`, token);
    await loadTemplates();
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Report Templates</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/reports")}>Back</Button>
          </div>
        </div>

        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />
        ) : (
          <div className="space-y-3">
            {templates.map((tpl) => (
              <Card key={tpl.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{tpl.name}</h3>
                      {tpl.is_builtin && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">builtin</span>
                      )}
                      <span className="text-xs text-muted-foreground">({CATEGORY_LABELS[tpl.category] ?? tpl.category})</span>
                    </div>
                    {tpl.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{tpl.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => router.push(`/reports/templates/${tpl.id}/edit`)}>
                      Edit
                    </Button>
                    {!tpl.is_builtin && (
                      <Button size="sm" variant="destructive" onClick={() => deleteTemplate(tpl.id)}>
                        Delete
                      </Button>
                    )}
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
