import { FastifyInstance } from "fastify";
import { db, tenants, stores, users } from "@raemonorepo/db";
import { eq } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function tenantRoutes(app: FastifyInstance) {
  app.addHook("onRequest", tenantMiddleware);

  app.get("/api/tenants/current", async (request, reply) => {
    const result = await db.select().from(tenants).where(eq(tenants.id, request.tenantId!));
    return reply.send(result[0]);
  });

  app.patch("/api/tenants/current", async (request, reply) => {
    const body = request.body as { name?: string; logo_url?: string };
    const updated = await db.update(tenants)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(tenants.id, request.tenantId!))
      .returning();
    return reply.send(updated[0]);
  });

  app.get("/api/stores", async (request, reply) => {
    const storeList = await db.select()
      .from(stores)
      .where(eq(stores.tenantId, request.tenantId!));
    return reply.send(storeList);
  });

  app.post("/api/stores", async (request, reply) => {
    const body = request.body as {
      name: string;
      address?: string;
      timezone?: string;
      sync_schedule?: string;
    };
    const store = await db.insert(stores).values({
      tenantId: request.tenantId!,
      name: body.name,
      address: body.address,
      timezone: body.timezone || "UTC",
      syncSchedule: body.sync_schedule,
    }).returning();
    return reply.status(201).send(store[0]);
  });

  app.get("/api/users", async (request, reply) => {
    const userList = await db.select()
      .from(users)
      .where(eq(users.tenantId, request.tenantId!));
    return reply.send(userList);
  });
}
