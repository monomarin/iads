import { FastifyInstance } from "fastify";
import { db, edgeNodes } from "@raemonorepo/db";
import { eq } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";
import { sendPushNotification } from "../services/fcm";

export async function edgeNodeRoutes(app: FastifyInstance) {
  app.addHook("preHandler", tenantMiddleware);

  app.get("/api/edge-nodes", async (request, _reply) => {
    const query = request.query as { storeId?: string };
    let result;
    if (query.storeId) {
      result = await db
        .select()
        .from(edgeNodes)
        .where(eq(edgeNodes.storeId, query.storeId as string))
        .orderBy(edgeNodes.name);
    } else {
      result = await db.select().from(edgeNodes).orderBy(edgeNodes.name);
    }
    return { nodes: result };
  });

  app.post("/api/edge-nodes/register", async (request, reply) => {
    const body = request.body as {
      storeId: string;
      name: string;
      deviceToken?: string;
      platform?: string;
      fcmToken?: string;
      firmwareVersion?: string;
    };
    if (!body.storeId || !body.name) {
      return reply.status(400).send({ error: "storeId and name required" });
    }

    const created = await db
      .insert(edgeNodes)
      .values({
        storeId: body.storeId,
        name: body.name,
        deviceToken: body.deviceToken,
        platform: body.platform ?? "android",
        fcmToken: body.fcmToken,
        firmwareVersion: body.firmwareVersion,
        settings: {},
        isOnline: true,
        lastSeenAt: new Date(),
      })
      .returning();
    return { node: created[0] };
  });

  app.put("/api/edge-nodes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      deviceToken?: string;
      platform?: string;
      fcmToken?: string;
      firmwareVersion?: string;
      settings?: Record<string, unknown>;
      isOnline?: boolean;
    };

    const existing = await db.select().from(edgeNodes).where(eq(edgeNodes.id, id as string)).limit(1);
    if (!existing[0]) return reply.status(404).send({ error: "Edge node not found" });

    const updated = await db
      .update(edgeNodes)
      .set({
        ...body,
        lastSeenAt: body.isOnline !== undefined ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(edgeNodes.id, id as string))
      .returning();
    return { node: updated[0] };
  });

  app.post("/api/edge-nodes/:id/heartbeat", async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await db.select().from(edgeNodes).where(eq(edgeNodes.id, id as string)).limit(1);
    if (!existing[0]) return reply.status(404).send({ error: "Edge node not found" });

    const updated = await db
      .update(edgeNodes)
      .set({ isOnline: true, lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(edgeNodes.id, id as string))
      .returning();
    return { node: updated[0] };
  });

  app.post("/api/edge-nodes/:id/push", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { command: string; payload?: Record<string, string> };
    if (!body.command) return reply.status(400).send({ error: "command required" });

    const node = await db.select().from(edgeNodes).where(eq(edgeNodes.id, id as string)).limit(1);
    if (!node[0]) return reply.status(404).send({ error: "Edge node not found" });
    if (!node[0].fcmToken) return reply.status(400).send({ error: "Node has no FCM token" });

    await sendPushNotification(
      node[0].fcmToken,
      "Edge Command",
      `Command: ${body.command}`,
      { command: body.command, ...(body.payload ?? {}) },
    );
    return { message: "Push sent", nodeId: id };
  });
}
