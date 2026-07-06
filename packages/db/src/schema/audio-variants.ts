import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { campaigns } from "./campaigns";

export const audioVariants = pgTable("audio_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  audioUrl: text("audio_url"),
  script: text("script").notNull().default(""),
  weight: integer("weight").notNull().default(20),
  isGenerated: boolean("is_generated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
