import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("store_admin"), // super_admin, advertiser, store_admin, technician
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
