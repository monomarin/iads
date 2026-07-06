import { pgTable, uuid, integer, date, timestamp } from "drizzle-orm/pg-core";

export const analyticsDaily = pgTable("analytics_daily", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  storeId: uuid("store_id"),
  date: date("date").notNull(),
  totalPlays: integer("total_plays").default(0).notNull(),
  uniqueListeners: integer("unique_listeners").default(0).notNull(),
  avgListenDurationSec: integer("avg_listen_duration_sec").default(0).notNull(),
  campaignId: uuid("campaign_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
