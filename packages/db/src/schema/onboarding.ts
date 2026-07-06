import { pgTable, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

export const onboardingProgress = pgTable("onboarding_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  step: integer("step").notNull().default(1),
  completed: boolean("completed").notNull().default(false),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
