import { pgTable, text, timestamp, uuid, boolean, jsonb, integer, primaryKey } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { audioCatalog } from "./audio-catalog";

export const playlists = pgTable("playlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  rules: jsonb("rules").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const playlistTracks = pgTable("playlist_tracks", {
  playlistId: uuid("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  trackId: uuid("track_id").notNull().references(() => audioCatalog.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.playlistId, table.trackId] }),
}));
