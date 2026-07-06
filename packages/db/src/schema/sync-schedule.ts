import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const syncSchedule = pgTable("sync_schedule", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
  cronExpression: text("cron_expression").notNull().default("0 2 * * *"),
  timezone: text("timezone").default("UTC").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  overrideGlobal: boolean("override_global").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
