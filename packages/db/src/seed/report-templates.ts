import { db } from "../index";
import { reportTemplates } from "../schema/report-templates";

const BUILTIN_TEMPLATES = [
  {
    slug: "ceo",
    name: "CEO Report",
    description: "High-level metrics for executive decision making",
    category: "ceo",
    isBuiltin: true,
    config: {
      sections: [
        {
          id: "overview",
          title: "Overview",
          widgets: [
            { id: "w1", title: "Total Plays", type: "number", metric: "total_plays", span: 1 },
            { id: "w2", title: "Active Campaigns", type: "number", metric: "active_campaigns", span: 1 },
            { id: "w3", title: "Revenue", type: "number", metric: "revenue", span: 1 },
            { id: "w4", title: "Stores Online", type: "number", metric: "stores_online", span: 1 },
          ],
        },
        {
          id: "trends",
          title: "Weekly Trends",
          widgets: [
            { id: "w5", title: "Plays Over Time", type: "line", metric: "total_plays", period: "weekly", span: 4 },
          ],
        },
      ],
    },
  },
  {
    slug: "technical",
    name: "Technical Report",
    description: "System health and infrastructure metrics",
    category: "technical",
    isBuiltin: true,
    config: {
      sections: [
        {
          id: "system",
          title: "System Health",
          widgets: [
            { id: "w1", title: "Sync Success Rate", type: "number", metric: "sync_success_rate", span: 1 },
            { id: "w2", title: "Edge Node Uptime", type: "number", metric: "edge_uptime", span: 1 },
            { id: "w3", title: "Errors (7d)", type: "number", metric: "error_count", span: 1 },
            { id: "w4", title: "Storage Used", type: "number", metric: "storage_used", span: 1 },
          ],
        },
        {
          id: "errors",
          title: "Error Breakdown",
          widgets: [
            { id: "w5", title: "Errors by Type", type: "pie", metric: "error_count", period: "daily", span: 2 },
            { id: "w6", title: "Sync Status History", type: "bar", metric: "sync_success_rate", period: "daily", span: 2 },
          ],
        },
      ],
    },
  },
  {
    slug: "store_admin",
    name: "Store Admin Report",
    description: "Per-store operational metrics",
    category: "store_admin",
    isBuiltin: true,
    config: {
      sections: [
        {
          id: "performance",
          title: "Store Performance",
          widgets: [
            { id: "w1", title: "Plays per Hour", type: "bar", metric: "plays_per_hour", period: "daily", span: 2 },
            { id: "w2", title: "Playlist Compliance", type: "number", metric: "compliance_rate", span: 1 },
            { id: "w3", title: "Schedule Adherence", type: "number", metric: "compliance_rate", span: 1 },
          ],
        },
        {
          id: "content",
          title: "Top Content",
          widgets: [
            { id: "w4", title: "Top Tracks", type: "table", metric: "top_tracks", period: "weekly", span: 4 },
          ],
        },
      ],
    },
  },
  {
    slug: "advertiser",
    name: "Advertiser Report",
    description: "Campaign performance and ROI metrics for advertisers",
    category: "advertiser",
    isBuiltin: true,
    config: {
      sections: [
        {
          id: "campaign",
          title: "Campaign Performance",
          widgets: [
            { id: "w1", title: "Total Impressions", type: "number", metric: "impressions", span: 1 },
            { id: "w2", title: "Estimated Reach", type: "number", metric: "impressions", span: 1 },
            { id: "w3", title: "A/B Test Results", type: "pie", metric: "ab_test_results", span: 2 },
          ],
        },
        {
          id: "roi",
          title: "ROI Analysis",
          widgets: [
            { id: "w4", title: "ROI Over Time", type: "line", metric: "roi", period: "weekly", span: 2 },
            { id: "w5", title: "Campaign Comparison", type: "table", metric: "active_campaigns", period: "monthly", span: 2 },
          ],
        },
      ],
    },
  },
];

export async function seedReportTemplates(tenantId: string) {
  for (const tpl of BUILTIN_TEMPLATES) {
    await db
      .insert(reportTemplates)
      .values({
        tenantId,
        name: tpl.name,
        slug: tpl.slug,
        description: tpl.description,
        category: tpl.category,
        config: tpl.config as any,
        isBuiltin: true,
      })
      .onConflictDoNothing();
  }
  console.log(`Seeded ${BUILTIN_TEMPLATES.length} builtin report templates`);
}
