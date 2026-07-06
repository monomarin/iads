import { pgTable, text, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const edgeNodes = pgTable("edge_nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  deviceToken: text("device_token"),
  platform: text("platform").default("android").notNull(),
  fcmToken: text("fcm_token"),
  lastSeenAt: timestamp("last_seen_at"),
  firmwareVersion: text("firmware_version"),
  settings: jsonb("settings").default({}),
  isOnline: boolean("is_online").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
