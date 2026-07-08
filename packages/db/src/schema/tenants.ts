import { pgTable, text, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  logoUrl: text("logo_url"),
  isDemo: boolean("is_demo").default(false).notNull(),
  features: jsonb("features").default(["analytics", "campaigns", "playlists", "edge-nodes", "billing"]).notNull(),
  syncSchedule: text("sync_schedule").default("0 2 * * *"),
  timezone: text("timezone").default("UTC"),
  suspendedAt: timestamp("suspended_at"),
  deletionScheduledAt: timestamp("deletion_scheduled_at"),
  deprovisionStep: text("deprovision_step").default("active").notNull(),
  deprovisionNotifiedAt: timestamp("deprovision_notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
