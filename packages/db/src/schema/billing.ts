import { pgTable, text, timestamp, uuid, integer, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  maxStores: integer("max_stores").default(1).notNull(),
  maxPlays: integer("max_plays").default(10000).notNull(),
  features: jsonb("features").default([]),
  isActive: boolean("is_active").default(true).notNull(),
});

export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").references(() => subscriptionPlans.id),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").default("active").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  stripeInvoiceId: text("stripe_invoice_id"),
  amount: numeric("amount").notNull(),
  currency: text("currency").default("usd").notNull(),
  status: text("status").default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
