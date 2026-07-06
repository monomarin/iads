import { pgTable, text, timestamp, uuid, jsonb, date } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { reportTemplates } from "./report-templates";
import { stores } from "./stores";

export const reportInstances = pgTable("report_instances", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").notNull().references(() => reportTemplates.id, { onDelete: "cascade" }),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  data: jsonb("data").notNull().default({}),
  status: text("status").default("generating").notNull(),
  format: text("format").default("json").notNull(),
  generatedAt: timestamp("generated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
