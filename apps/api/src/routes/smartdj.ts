import { FastifyInstance } from "fastify";
import { db, playlists, playlistTracks, audioCatalog } from "@raemonorepo/db";
import { eq, sql, inArray } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";

const TIME_MOOD_MAP: Record<string, string[]> = {
  morning: ["calm", "neutral", "happy", "ambient"],
  afternoon: ["energetic", "happy", "neutral", "pop"],
  evening: ["festive", "latin", "electronic", "energetic"],
  night: ["ambient", "calm", "jazz", "neutral"],
};

const AFFLUENCE_MOOD_MAP: Record<string, string[]> = {
  low: ["calm", "ambient", "jazz", "neutral"],
  medium: ["happy", "neutral", "pop"],
  high: ["energetic", "festive", "latin", "electronic"],
};

function getTimePeriod(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export async function smartDJRoutes(app: FastifyInstance) {
  app.addHook("onRequest", tenantMiddleware);

  app.get("/api/smartdj/next", async (request, reply) => {
    const timePeriod = getTimePeriod();
    const query = request.query as { affluence?: string; last_track_id?: string };
    const affluence = query.affluence || "medium";

    const timeMoods = TIME_MOOD_MAP[timePeriod] || ["neutral"];
    const affluenceMoods = AFFLUENCE_MOOD_MAP[affluence] || ["neutral"];
    const preferredMoods = [...new Set([...timeMoods, ...affluenceMoods])];

    const activePlaylists = await db.select()
      .from(playlists)
      .where(sql`${playlists.tenantId} = ${request.tenantId} AND ${playlists.isActive} = true`)
      .limit(1);

    if (!activePlaylists[0]) {
      return reply.send({ track: null, message: "No active playlist" });
    }

    const pl = activePlaylists[0];
    const rules = pl.rules as Record<string, unknown>;
    const genreFilter = rules.genre_filter as string | undefined;
    const moodFilter = rules.mood_filter as string | undefined;
    const bpmMin = (rules.bpm_range as { min?: number })?.min;
    const bpmMax = (rules.bpm_range as { max?: number })?.max;

    const plTracks = await db.select({ trackId: playlistTracks.trackId })
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, pl.id));

    if (plTracks.length === 0) {
      return reply.send({ track: null, message: "Playlist is empty" });
    }

    const trackIds = plTracks.map((t) => t.trackId);
    let tracks = await db.select().from(audioCatalog)
      .where(inArray(audioCatalog.id, trackIds))
      .limit(50);

    if (genreFilter) {
      tracks = tracks.filter((t) => t.genre === genreFilter);
    }
    if (moodFilter) {
      tracks = tracks.filter((t) => t.mood === moodFilter);
    }

    if (!genreFilter && !moodFilter) {
      const scored = tracks.map((t) => ({
        track: t,
        score: preferredMoods.includes(t.mood || "") ? 2 : t.mood ? 1 : 0,
      }));
      scored.sort((a, b) => b.score - a.score);
      tracks = scored.map((s) => s.track);
    }

    if (bpmMin !== undefined) {
      tracks = tracks.filter((t) => t.bpm !== null && t.bpm >= bpmMin);
    }
    if (bpmMax !== undefined) {
      tracks = tracks.filter((t) => t.bpm !== null && t.bpm <= bpmMax);
    }

    const shuffledTracks = shuffleArray(tracks);

    if (query.last_track_id) {
      const lastIndex = shuffledTracks.findIndex((t) => t.id === query.last_track_id);
      if (lastIndex >= 0 && lastIndex < shuffledTracks.length - 1) {
        return reply.send({ track: shuffledTracks[lastIndex + 1] });
      }
    }

    return reply.send({
      track: shuffledTracks[0] || null,
      context: { timePeriod, affluence, preferredMoods },
    });
  });

  app.post("/api/smartdj/regenerate", async (request, reply) => {
    const body = request.body as {
      playlist_id?: string;
      genre_filter?: string;
      mood_filter?: string;
    };

    const targetPlaylists = body.playlist_id
      ? await db.select().from(playlists).where(sql`${playlists.id} = ${body.playlist_id} AND ${playlists.tenantId} = ${request.tenantId}`)
      : await db.select().from(playlists).where(eq(playlists.tenantId, request.tenantId!));

    const updated: typeof targetPlaylists = [];

    for (const pl of targetPlaylists) {
      const newRules: Record<string, unknown> = {};
      if (body.genre_filter) newRules.genre_filter = body.genre_filter;
      if (body.mood_filter) newRules.mood_filter = body.mood_filter;

      const result = await db.update(playlists)
        .set({ rules: { ...(pl.rules as Record<string, unknown>), ...newRules }, updatedAt: new Date() })
        .where(eq(playlists.id, pl.id))
        .returning();
      updated.push(result[0]!);
    }

    return reply.send(updated);
  });
}
