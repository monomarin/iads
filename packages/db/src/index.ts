import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as tenants from "./schema/tenants";
import * as stores from "./schema/stores";
import * as users from "./schema/users";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/raemonorepo";

const client = postgres(connectionString);

export const db = drizzle(client, {
  schema: { ...tenants, ...stores, ...users },
});

export { tenants, stores, users };
