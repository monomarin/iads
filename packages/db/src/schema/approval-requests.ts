import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const approvalRequests = pgTable("approval_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  payload: jsonb("payload").default({}).notNull(),
  status: text("status").default("pending").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewComment: text("review_comment"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
