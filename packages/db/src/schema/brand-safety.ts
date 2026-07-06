import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { audioVariants } from "./audio-variants";

export const brandSafetyLogs = pgTable("brand_safety_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  variantId: uuid("variant_id").notNull().references(() => audioVariants.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(),
  score: integer("score"),
  layers: jsonb("layers").default([]),
  summary: text("summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brandSafetyRules = pgTable("brand_safety_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  country: text("country").notNull(),
  rules: jsonb("rules").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
