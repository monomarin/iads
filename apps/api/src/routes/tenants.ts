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
    const body = request.body as {
      name?: string;
      logo_url?: string;
      sync_schedule?: string;
      timezone?: string;
    };
    // Build partial update — only include defined fields
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.logo_url !== undefined) patch.logoUrl = body.logo_url;
    if (body.sync_schedule !== undefined) patch.syncSchedule = body.sync_schedule;
    if (body.timezone !== undefined) patch.timezone = body.timezone;

    const updated = await db.update(tenants)
      .set(patch)
      .where(eq(tenants.id, request.tenantId!))
      .returning();
    return reply.send(updated[0]);
  });

  // ─── Super-admin: list all tenants ─────────────────────────────────────────
  app.get("/api/admin/tenants", async (_request, reply) => {
    try {
      const all = await db.select().from(tenants).orderBy(tenants.createdAt);
      return reply.send(all);
    } catch (e) {
      console.error("Failed to list tenants", e);
      return reply.status(500).send({ error: "Failed to list tenants" });
    }
  });

  // ─── Super-admin: list all stores ──────────────────────────────────────────
  app.get("/api/admin/stores", async (_request, reply) => {
    try {
      const all = await db.select().from(stores).orderBy(stores.createdAt);
      return reply.send(all);
    } catch (e) {
      console.error("Failed to list all stores", e);
      return reply.status(500).send({ error: "Failed to list all stores" });
    }
  });

  // ─── Super-admin: update tenant feature flags ──────────────────────────────
  app.patch("/api/admin/tenants/:id/features", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { features: string[] };

    if (!Array.isArray(body?.features)) {
      return reply.status(400).send({ error: "features must be an array of strings" });
    }

    // Validate allowed feature keys
    const ALLOWED = ["analytics", "campaigns", "playlists", "edge-nodes", "billing"];
    const filtered = body.features.filter((f) => ALLOWED.includes(f));

    try {
      const updated = await db.update(tenants)
        .set({ features: filtered, updatedAt: new Date() })
        .where(eq(tenants.id, id))
        .returning();
      if (!updated[0]) return reply.status(404).send({ error: "Tenant not found" });
      return reply.send(updated[0]);
    } catch (e) {
      console.error("Failed to update tenant features", e);
      return reply.status(500).send({ error: "Failed to update features" });
    }
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
      legalName?: string;
      commercialName?: string;
      vertical?: string;
      storeCode?: string;
      latitude?: string;
      longitude?: string;
      address?: string;
      timezone?: string;
      sync_schedule?: string;
    };
    const store = await db.insert(stores).values({
      tenantId: request.tenantId!,
      name: body.name,
      legalName: body.legalName,
      commercialName: body.commercialName,
      vertical: body.vertical,
      storeCode: body.storeCode,
      latitude: body.latitude,
      longitude: body.longitude,
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
