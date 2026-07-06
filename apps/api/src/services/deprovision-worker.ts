import { db, tenants, stores, users, campaigns, audioCatalog, playlists, reportTemplates, reportInstances, approvalRequests, approvalAudit } from "@raemonorepo/db";
import { eq, sql } from "drizzle-orm";
import { syncQueue } from "./sync-queue";

const DEPROVISION_STEPS = ["suspended", "grace", "warning", "deleting"] as const;
const DAY_MARKS = [0, 7, 30, 37];

export async function processDeprovisionQueue() {
  const now = new Date();

  for (let i = 0; i < DEPROVISION_STEPS.length; i++) {
    const step = DEPROVISION_STEPS[i];
    const dayThreshold = DAY_MARKS[i]!;

    const candidates = await db
      .select()
      .from(tenants)
      .where(
        sql`${tenants.deprovisionStep} = ${step}
          AND ${tenants.suspendedAt} IS NOT NULL
          AND EXTRACT(DAY FROM (${now}::timestamp - ${tenants.suspendedAt})) >= ${dayThreshold}
          AND (${tenants.deprovisionNotifiedAt} IS NULL
            OR ${tenants.deprovisionNotifiedAt} < ${tenants.suspendedAt})`
      );

    for (const tenant of candidates) {
      const nextStep = DEPROVISION_STEPS[i + 1] ?? "deleted";

      if (nextStep === "deleting") {
        await deleteTenantData(tenant.id, tenant.name);
      } else {
        await db
          .update(tenants)
          .set({ deprovisionStep: nextStep, deprovisionNotifiedAt: now, updatedAt: now })
          .where(eq(tenants.id, tenant.id));
        console.log(`[Deprovision] ${tenant.name} → ${nextStep}`);
      }
    }
  }
}

async function deleteTenantData(tenantId: string, tenantName: string) {
  const tables = [
    approvalAudit, approvalRequests, reportInstances, reportTemplates,
    playlists,
    audioCatalog, campaigns, stores, users,
  ];
  for (const table of tables) {
    await db.delete(table).where(eq(table.tenantId, tenantId as string));
  }
  await db.update(tenants)
    .set({ deprovisionStep: "deleted", deletionScheduledAt: new Date(), updatedAt: new Date() })
    .where(eq(tenants.id, tenantId as string));
  console.log(`[Deprovision] Deleted all data for ${tenantName}`);
}

export async function startDeprovisionCron() {
  await syncQueue.add("deprovision-check", {}, {
    repeat: { pattern: "0 8 * * *" },
    removeOnComplete: true,
    removeOnFail: false,
  });
  console.log("[Deprovision] Cron scheduled: 0 8 * * *");
}
