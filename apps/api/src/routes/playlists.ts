import { FastifyInstance } from "fastify";
import { db, playlists, playlistTracks, audioCatalog } from "@raemonorepo/db";
import { eq, sql, and, desc } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

export async function playlistRoutes(app: FastifyInstance) {
  app.addHook("onRequest", tenantMiddleware);

  app.get("/api/playlists", async (request, reply) => {
    const list = await db.select().from(playlists)
      .where(eq(playlists.tenantId, request.tenantId!))
      .orderBy(desc(playlists.createdAt));
    return reply.send(list);
  });

  app.post("/api/playlists", async (request, reply) => {
    const body = request.body as {
      name: string;
      description?: string;
      rules?: Record<string, unknown>;
    };

    const playlist = await db.insert(playlists).values({
      tenantId: request.tenantId!,
      name: body.name,
      description: body.description,
      rules: body.rules || {},
    }).returning();

    return reply.status(201).send(playlist[0]);
  });

  app.get("/api/playlists/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const playlist = await db.select().from(playlists)
      .where(sql`${playlists.id} = ${id} AND ${playlists.tenantId} = ${request.tenantId}`)
      .limit(1);

    if (!playlist[0]) {
      return reply.status(404).send({ error: "Playlist not found" });
    }

    const tracks = await db.select()
      .from(playlistTracks)
      .innerJoin(audioCatalog, eq(playlistTracks.trackId, audioCatalog.id))
      .where(eq(playlistTracks.playlistId, id))
      .orderBy(playlistTracks.position);

    return reply.send({ ...playlist[0], tracks });
  });

  app.put("/api/playlists/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      description?: string;
      rules?: Record<string, unknown>;
      is_active?: boolean;
    };

    const updated = await db.update(playlists)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.rules ? { rules: body.rules } : {}),
        ...(body.is_active !== undefined ? { isActive: body.is_active } : {}),
        updatedAt: new Date(),
      })
      .where(sql`${playlists.id} = ${id} AND ${playlists.tenantId} = ${request.tenantId}`)
      .returning();

    if (!updated[0]) {
      return reply.status(404).send({ error: "Playlist not found" });
    }
    return reply.send(updated[0]);
  });

  app.post("/api/playlists/:id/tracks", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { track_id: string };

    const maxPos = await db.select({ max: sql<number>`COALESCE(MAX(position), -1) + 1` })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, id));

    await db.insert(playlistTracks).values({
      playlistId: id,
      trackId: body.track_id,
      position: maxPos[0]?.max ?? 0,
    });

    return reply.status(201).send({ success: true });
  });

  app.delete("/api/playlists/:id/tracks/:tid", async (request, reply) => {
    const { id, tid } = request.params as { id: string; tid: string };
    await db.delete(playlistTracks)
      .where(and(eq(playlistTracks.playlistId, id), eq(playlistTracks.trackId, tid)));
    return reply.send({ success: true });
  });

  app.delete("/api/playlists/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(playlists)
      .where(sql`${playlists.id} = ${id} AND ${playlists.tenantId} = ${request.tenantId}`);
    return reply.send({ success: true });
  });
}
