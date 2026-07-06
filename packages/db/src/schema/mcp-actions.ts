import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const mcpActions = pgTable("mcp_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  label: text("label").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
