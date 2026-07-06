import { pgTable, text, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";

export const integrations = pgTable("integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  provider: text("provider").notNull(),
  label: text("label"),
  config: jsonb("config").default({}),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const integrationLogs = pgTable("integration_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  integrationId: uuid("integration_id").notNull(),
  event: text("event").notNull(),
  status: text("status").default("success").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
