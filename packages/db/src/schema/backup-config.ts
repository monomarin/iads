import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const backupConfig = pgTable("backup_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  retentionDays: integer("retention_days").default(30).notNull(),
  frequency: text("frequency").default("daily").notNull(),
  time: text("time").default("03:00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const backupLogs = pgTable("backup_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  status: text("status").default("running").notNull(),
  size: text("size"),
  errorLog: text("error_log"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});
