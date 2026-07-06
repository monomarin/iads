import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const audioCatalog = pgTable("audio_catalog", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fileKey: text("file_key").unique().notNull(),
  durationSeconds: integer("duration_seconds"),
  genre: text("genre"),
  mood: text("mood"),
  bpm: integer("bpm"),
  isUploaded: boolean("is_uploaded").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
