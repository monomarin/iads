import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tenants } from "./schema/tenants";
import { stores } from "./schema/stores";
import { users } from "./schema/users";
import { onboardingProgress } from "./schema/onboarding";
import { tenantInvitations } from "./schema/invitations";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/raemonorepo";

const client = postgres(connectionString);

export const db = drizzle(client, {
  schema: { tenants, stores, users, onboardingProgress, tenantInvitations },
});

export { tenants, stores, users, onboardingProgress, tenantInvitations };
export { rlsPoliciesSql, rlsSetSessionSql } from "./rls";
