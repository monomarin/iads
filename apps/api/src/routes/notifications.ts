import { FastifyInstance } from "fastify";
import { db, notifications, notificationPreferences } from "@raemonorepo/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

const NOTIFICATION_TYPES = [
  "sync_complete", "sync_failed", "campaign_activated", "campaign_ended",
  "approval_requested", "approval_resolved", "audio_audit_issue", "deprovision_warning",
  "brand_safety_alert", "ambient_threshold", "backup_complete", "billing_receipt",
] as const;

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/notifications", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const query = request.query as { unread?: string; type?: string; limit?: string };

    const conditions = [eq(notifications.tenantId, tenantId as string)];
    if (query.unread === "true") conditions.push(eq(notifications.isRead, false));
    if (query.type) conditions.push(eq(notifications.type, query.type));

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(Number(query.limit ?? 50));

    if (rows.length === 0) {
      const mockNotifications = [
        { tenantId: tenantId as string, type: "sync_complete", title: "Sync Complete", message: "All stores synced successfully.", channel: "in_app" },
        { tenantId: tenantId as string, type: "campaign_activated", title: "Campaign Live", message: "Summer Sale campaign is now active.", channel: "in_app" },
        { tenantId: tenantId as string, type: "approval_requested", title: "Approval Needed", message: "New campaign variant requires approval.", channel: "in_app" },
      ];

      for (const n of mockNotifications) {
        await db.insert(notifications).values(n);
      }
      const seeded = await db
        .select()
        .from(notifications)
        .where(eq(notifications.tenantId, tenantId as string))
        .orderBy(desc(notifications.createdAt));
      return { notifications: seeded };
    }

    return { notifications: rows };
  });

  app.put("/api/notifications/:id/read", async (request, reply) => {
    const { id } = request.params as { id: string };
    const updated = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id as string))
      .returning();
    if (!updated[0]) return reply.status(404).send({ error: "Notification not found" });
    return { notification: updated[0] };
  });

  app.put("/api/notifications/read-all", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.tenantId, tenantId as string), eq(notifications.isRead, false)));
    return { success: true };
  });

  app.get("/api/notifications/unread-count", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(and(eq(notifications.tenantId, tenantId as string), eq(notifications.isRead, false)));
    return { unread: Number(result[0]?.count ?? 0) };
  });

  app.get("/api/notifications/preferences", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, tenantId as string));

    if (prefs.length === 0) {
      const defaults = [
        { userId: tenantId as string, channel: "in_app", enabled: true, types: NOTIFICATION_TYPES },
        { userId: tenantId as string, channel: "email", enabled: true, types: ["sync_failed", "deprovision_warning", "billing_receipt"] },
        { userId: tenantId as string, channel: "push", enabled: false, types: [] },
      ];
      for (const p of defaults) {
        await db.insert(notificationPreferences).values(p);
      }
      const seeded = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, tenantId as string));
      return { preferences: seeded };
    }

    return { preferences: prefs };
  });

  app.put("/api/notifications/preferences", async (request, _reply) => {
    const { tenantId } = request as unknown as { tenantId: string };
    const body = request.body as Array<{ channel: string; enabled: boolean; types: string[] }>;

    for (const pref of body) {
      const existing = await db
        .select()
        .from(notificationPreferences)
        .where(and(
          eq(notificationPreferences.userId, tenantId as string),
          eq(notificationPreferences.channel, pref.channel),
        ))
        .limit(1);

      if (existing[0]) {
        await db
          .update(notificationPreferences)
          .set({ enabled: pref.enabled, types: pref.types as any })
          .where(eq(notificationPreferences.id, existing[0].id));
      } else {
        await db.insert(notificationPreferences).values({
          userId: tenantId as string,
          channel: pref.channel,
          enabled: pref.enabled,
          types: pref.types as any,
        });
      }
    }

    return { success: true };
  });
}
