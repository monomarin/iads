import { pgTable, text, timestamp, uuid, integer, numeric, jsonb, boolean } from "drizzle-orm/pg-core";

export const advertisers = pgTable("advertisers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  brandName: text("brand_name").notNull(),
  logoUrl: text("logo_url"),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const adCampaigns = pgTable("ad_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  advertiserId: uuid("advertiser_id").notNull().references(() => advertisers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").default("draft").notNull(),
  audioUrl: text("audio_url"),
  script: text("script"),
  targetSegments: jsonb("target_segments").default([]),
  schedule: jsonb("schedule").default({}),
  budget: numeric("budget").default("0").notNull(),
  cpm: numeric("cpm").default("10").notNull(),
  spent: numeric("spent").default("0").notNull(),
  playsTotal: integer("plays_total").default(0).notNull(),
  dayparting: jsonb("dayparting").default({}),
  frequencyCap: integer("frequency_cap").default(2).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
