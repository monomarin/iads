import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { campaigns } from "./campaigns";

export const audioAuditLogs = pgTable("audio_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  checkType: text("check_type").notNull(),
  playCount: integer("play_count").default(0).notNull(),
  status: text("status").notNull().default("passed"),
  issues: jsonb("issues").default([]),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});
