import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  type: text("type").notNull().default("scheduled"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  itemsSynced: integer("items_synced").default(0),
  itemsFailed: integer("items_failed").default(0),
  errorLog: text("error_log"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
