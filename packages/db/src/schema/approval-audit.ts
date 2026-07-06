import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { approvalRequests } from "./approval-requests";
import { users } from "./users";

export const approvalAudit = pgTable("approval_audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  approvalId: uuid("approval_id").notNull().references(() => approvalRequests.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  performedBy: uuid("performed_by").notNull().references(() => users.id),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
