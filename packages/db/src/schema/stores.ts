import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  commercialName: text("commercial_name"),
  vertical: text("vertical"),
  storeCode: text("store_code"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  address: text("address"),
  timezone: text("timezone").default("UTC").notNull(),
  syncSchedule: text("sync_schedule"), // cron expression
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
