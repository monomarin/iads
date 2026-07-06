import { db, campaigns, playlists, syncSchedule } from "@raemonorepo/db";
import { eq } from "drizzle-orm";
import { addSyncJob } from "./sync-queue";

export async function executeApprovedAction(
  action: string,
  _targetType: string,
  targetId: string,
  payload: Record<string, unknown>,
) {
  switch (action) {
    case "activate_campaign": {
      await db
        .update(campaigns)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(campaigns.id, targetId as string));
      break;
    }
    case "publish_playlist": {
      await db
        .update(playlists)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(playlists.id, targetId as string));
      break;
    }
    case "force_sync": {
      await addSyncJob(targetId, "manual");
      break;
    }
    case "edge_command": {
      break;
    }
    case "change_schedule": {
      const { cronExpression, timezone, isActive, overrideGlobal } = payload;
      const existing = await db
        .select()
        .from(syncSchedule)
        .where(eq(syncSchedule.storeId, targetId as string))
        .limit(1);
      if (existing[0]) {
        await db
          .update(syncSchedule)
          .set({
            cronExpression: (cronExpression as string) ?? existing[0].cronExpression,
            timezone: (timezone as string) ?? existing[0].timezone,
            isActive: (isActive as boolean) ?? existing[0].isActive,
            overrideGlobal: (overrideGlobal as boolean) ?? existing[0].overrideGlobal,
            updatedAt: new Date(),
          })
          .where(eq(syncSchedule.id, existing[0].id));
      }
      break;
    }
    default:
      console.warn(`No executor for action: ${action}`);
  }
}
