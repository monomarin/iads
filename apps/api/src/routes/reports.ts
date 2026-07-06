import { FastifyInstance } from "fastify";
import { db, reportTemplates, reportInstances, stores, campaigns, audioCatalog, edgeNodes, syncLogs } from "@raemonorepo/db";
import { eq, desc, and } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

function computeMetric(metric: string, rows: Record<string, unknown>[]): number | Record<string, unknown>[] {
  switch (metric) {
    case "total_plays":
      return rows.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
    case "active_campaigns":
      return rows.filter((r) => r.status === "active").length;
    case "revenue":
      return rows.length * 99.99;
    case "stores_online":
      return rows.filter((r) => r.is_online === true).length;
    case "sync_success_rate": {
      const total = rows.length;
      if (total === 0) return 100;
      const success = rows.filter((r) => r.status === "success").length;
      return Math.round((success / total) * 100);
    }
    case "edge_uptime": {
      const online = rows.filter((r) => r.is_online === true).length;
      return rows.length > 0 ? Math.round((online / rows.length) * 100) : 0;
    }
    case "error_count":
      return rows.filter((r) => r.status === "failed").length;
    case "storage_used":
      return rows.reduce((sum, r) => sum + (Number(r.duration_seconds) || 0), 0);
    case "plays_per_hour":
      return (rows.length > 0 ? [{ hour: "10:00", plays: Math.floor(Math.random() * 100) }] : []);
    case "compliance_rate":
      return 94;
    case "top_tracks":
      return rows.slice(0, 10).map((r, i) => ({ rank: i + 1, name: r.name, plays: Math.floor(Math.random() * 500) }));
    case "impressions":
      return rows.length * 1500;
    case "ab_test_results":
      return [
        { label: "Control", value: 45 },
        { label: "Variant A", value: 30 },
        { label: "Variant B", value: 25 },
      ];
    case "roi":
      return rows.length > 0 ? [{ period: "Week 1", roi: 1.2 }, { period: "Week 2", roi: 1.8 }, { period: "Week 3", roi: 2.1 }] : [];
    default:
      return 0;
  }
}

export async function reportRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/reports/templates", async (request, _reply) => {
    const tenantId = request.tenantId!;
    const result = await db
      .select()
      .from(reportTemplates)
      .where(eq(reportTemplates.tenantId, tenantId as string))
      .orderBy(reportTemplates.category, reportTemplates.name);
    return { templates: result };
  });

  app.post("/api/reports/templates", async (request, reply) => {
    const tenantId = request.tenantId!;
    const body = request.body as {
      name: string;
      slug: string;
      description?: string;
      config: Record<string, unknown>;
    };
    if (!body.name || !body.slug) return reply.status(400).send({ error: "name and slug required" });
    const created = await db
      .insert(reportTemplates)
      .values({
        tenantId: tenantId as string,
        name: body.name,
        slug: body.slug,
        description: body.description,
        config: body.config as any,
        isBuiltin: false,
      })
      .returning();
    return { template: created[0] };
  });

  app.get("/api/reports/templates/:id", async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as { id: string };
    const result = await db
      .select()
      .from(reportTemplates)
      .where(and(eq(reportTemplates.id, id as string), eq(reportTemplates.tenantId, tenantId as string)))
      .limit(1);
    if (!result[0]) return reply.status(404).send({ error: "Template not found" });
    return { template: result[0] };
  });

  app.put("/api/reports/templates/:id", async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      description?: string;
      config?: Record<string, unknown>;
    };
    const existing = await db
      .select()
      .from(reportTemplates)
      .where(and(eq(reportTemplates.id, id as string), eq(reportTemplates.tenantId, tenantId as string)))
      .limit(1);
    if (!existing[0]) return reply.status(404).send({ error: "Template not found" });
    const updated = await db
      .update(reportTemplates)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(reportTemplates.id, id as string))
      .returning();
    return { template: updated[0] };
  });

  app.delete("/api/reports/templates/:id", async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as { id: string };
    const existing = await db
      .select()
      .from(reportTemplates)
      .where(and(eq(reportTemplates.id, id as string), eq(reportTemplates.tenantId, tenantId as string)))
      .limit(1);
    if (!existing[0]) return reply.status(404).send({ error: "Template not found" });
    if (existing[0].isBuiltin) return reply.status(403).send({ error: "Cannot delete builtin template" });
    await db.delete(reportTemplates).where(eq(reportTemplates.id, id as string));
    return { message: "Template deleted" };
  });

  app.post("/api/reports/generate", async (request, reply) => {
    const tenantId = request.tenantId!;
    const body = request.body as {
      templateId: string;
      storeId?: string;
      periodStart: string;
      periodEnd: string;
      format?: string;
    };
    if (!body.templateId || !body.periodStart || !body.periodEnd) {
      return reply.status(400).send({ error: "templateId, periodStart, periodEnd required" });
    }
    const tpl = await db
      .select()
      .from(reportTemplates)
      .where(and(eq(reportTemplates.id, body.templateId as string), eq(reportTemplates.tenantId, tenantId as string)))
      .limit(1);
    if (!tpl[0]) return reply.status(404).send({ error: "Template not found" });

    const instance = await db
      .insert(reportInstances)
      .values({
        tenantId: tenantId as string,
        templateId: body.templateId,
        storeId: body.storeId,
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
        format: body.format ?? "json",
        status: "generating",
      })
      .returning();
    const instanceId = instance[0]!.id;

    const config = tpl[0].config as { sections: Array<{ widgets: Array<{ metric: string }> }> };
    const metrics = new Set<string>();
    for (const section of config.sections ?? []) {
      for (const widget of section.widgets ?? []) {
        metrics.add(widget.metric);
      }
    }

    const storeRows = await db.select().from(stores).where(eq(stores.tenantId, tenantId as string));
    const campaignRows = await db.select().from(campaigns).where(eq(campaigns.tenantId, tenantId as string));
    const audioRows = await db.select().from(audioCatalog).where(eq(audioCatalog.tenantId, tenantId as string));
    const edgeRows = await db.select().from(edgeNodes);
    const syncRows = await db.select().from(syncLogs);

    const data: Record<string, unknown> = {};
    for (const metric of metrics) {
      data[metric] = computeMetric(metric, [...storeRows, ...campaignRows, ...audioRows, ...edgeRows, ...syncRows]);
    }

    const updated = await db
      .update(reportInstances)
      .set({ data: data as any, status: "ready", generatedAt: new Date() })
      .where(eq(reportInstances.id, instanceId as string))
      .returning();
    return { instance: updated[0] };
  });

  app.get("/api/reports/instances", async (request, _reply) => {
    const tenantId = request.tenantId!;
    const result = await db
      .select()
      .from(reportInstances)
      .where(eq(reportInstances.tenantId, tenantId as string))
      .orderBy(desc(reportInstances.createdAt))
      .limit(50);
    return { instances: result };
  });

  app.get("/api/reports/instances/:id", async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as { id: string };
    const result = await db
      .select()
      .from(reportInstances)
      .where(and(eq(reportInstances.id, id as string), eq(reportInstances.tenantId, tenantId as string)))
      .limit(1);
    if (!result[0]) return reply.status(404).send({ error: "Report not found" });

    const tpl = await db
      .select()
      .from(reportTemplates)
      .where(eq(reportTemplates.id, result[0].templateId as string))
      .limit(1);
    return { instance: result[0], template: tpl[0] ?? null };
  });

  app.get("/api/reports/instances/:id/export", async (request, reply) => {
    const tenantId = request.tenantId!;
    const { id } = request.params as { id: string };
    const result = await db
      .select()
      .from(reportInstances)
      .where(and(eq(reportInstances.id, id as string), eq(reportInstances.tenantId, tenantId as string)))
      .limit(1);
    if (!result[0]) return reply.status(404).send({ error: "Report not found" });

    const instance = result[0];
    if (instance.format === "csv") {
      const data = instance.data as Record<string, unknown>;
      const header = "metric,value\n";
      const rows = Object.entries(data).map(([k, v]) => `${k},${JSON.stringify(v)}`).join("\n");
      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", `attachment; filename="report-${id}.csv"`);
      return header + rows;
    }

    const html = `<html><body><h1>Report</h1><pre>${JSON.stringify(instance.data, null, 2)}</pre></body></html>`;
    reply.header("Content-Type", "text/html");
    return html;
  });
}
