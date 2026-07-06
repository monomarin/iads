import { pgTable, text, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  userId: uuid("user_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").default({}),
  isRead: boolean("is_read").default(false).notNull(),
  channel: text("channel").default("in_app").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  channel: text("channel").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  types: jsonb("types").default([]),
});
