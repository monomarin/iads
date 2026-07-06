import { db } from "../index";
import { tenants } from "../schema/tenants";
import { stores } from "../schema/stores";
import { users } from "../schema/users";
import { onboardingProgress } from "../schema/onboarding";
import { rlsPoliciesSql } from "../rls";
import { seedReportTemplates } from "./report-templates";

const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000002";
const DEMO_STORE_ID = "00000000-0000-0000-0000-000000000003";

export async function seed() {
  // Apply RLS policies
  for (const statement of rlsPoliciesSql.split(";").filter(Boolean)) {
    await db.execute(statement);
  }

  // Seed demo tenant
  await db.insert(tenants).values({
    id: DEMO_TENANT_ID,
    name: "Demo Store",
    slug: "demo-store",
  }).onConflictDoNothing();

  // Seed demo store
  await db.insert(stores).values({
    id: DEMO_STORE_ID,
    tenantId: DEMO_TENANT_ID,
    name: "Demo Store - Downtown",
    address: "123 Main St, City",
    timezone: "America/New_York",
    syncSchedule: "0 2 * * *",
  }).onConflictDoNothing();

  // Seed demo admin user (clerkId is placeholder — replace with real Clerk ID)
  await db.insert(users).values({
    id: DEMO_USER_ID,
    clerkId: "demo_clerk_id",
    tenantId: DEMO_TENANT_ID,
    email: "admin@demo.com",
    role: "super_admin",
  }).onConflictDoNothing();

  // Seed onboarding as completed for demo
  await db.insert(onboardingProgress).values({
    userId: DEMO_USER_ID,
    step: 0,
    completed: true,
    data: { name: "Demo Store - Downtown", address: "123 Main St, City" },
  }).onConflictDoNothing();

  // Seed builtin report templates
  await seedReportTemplates(DEMO_TENANT_ID);

  console.log("Seed complete: demo tenant, store, user, onboarding, and report templates created.");
}

seed().catch(console.error);
