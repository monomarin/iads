export type ReportCategory = "ceo" | "technical" | "store_admin" | "advertiser" | "custom";
export type WidgetType = "number" | "bar" | "line" | "pie" | "table";
export type MetricType =
  | "total_plays" | "active_campaigns" | "revenue" | "stores_online"
  | "sync_success_rate" | "edge_uptime" | "error_count" | "storage_used"
  | "plays_per_hour" | "compliance_rate" | "top_tracks" | "impressions"
  | "ab_test_results" | "roi";

export interface ReportWidget {
  id: string;
  title: string;
  type: WidgetType;
  metric: MetricType;
  period?: "daily" | "weekly" | "monthly";
  span?: 1 | 2 | 3 | 4;
}

export interface ReportSection {
  id: string;
  title: string;
  description?: string;
  widgets: ReportWidget[];
}

export interface ReportTemplateConfig {
  sections: ReportSection[];
}

export interface ReportTemplate {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  category: ReportCategory;
  config: ReportTemplateConfig;
  isBuiltin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportInstance {
  id: string;
  tenantId: string;
  templateId: string;
  storeId?: string;
  periodStart: string;
  periodEnd: string;
  data: Record<string, unknown>;
  status: "generating" | "ready" | "failed";
  format: "json" | "pdf" | "csv";
  generatedAt?: string;
  createdAt: string;
}
