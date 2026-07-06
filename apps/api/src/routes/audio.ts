import { FastifyInstance } from "fastify";
import { db, audioCatalog } from "@raemonorepo/db";
import { eq, sql, desc } from "drizzle-orm";
import { tenantMiddleware } from "../middleware/tenant";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

export async function audioRoutes(app: FastifyInstance) {
  app.addHook("onRequest", tenantMiddleware);

  app.get("/api/audio", async (request, reply) => {
    const { genre, mood } = request.query as { genre?: string; mood?: string };
    const conditions = [eq(audioCatalog.tenantId, request.tenantId!)];
    if (genre) conditions.push(eq(audioCatalog.genre, genre));
    if (mood) conditions.push(eq(audioCatalog.mood, mood));

    const list = await db.select().from(audioCatalog)
      .where(conditions.length === 1 ? conditions[0]! : sql`${conditions.join(" AND ")}`)
      .orderBy(desc(audioCatalog.createdAt));

    return reply.send(list);
  });

  app.post("/api/audio/upload", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: "No file provided" });
    }

    const buffer = await data.toBuffer();
    const fileName = data.filename;
    const fileKey = `${request.tenantId}/${Date.now()}-${fileName}`;
    const r2 = createR2Client();

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: data.mimetype,
    }));

    const metadata = data.fields;
    const getField = (name: string): string | undefined => {
      const field = metadata[name];
      if (field && typeof field === "object" && "value" in field) {
        return field.value as string;
      }
      return undefined;
    };

    const entry = await db.insert(audioCatalog).values({
      tenantId: request.tenantId!,
      name: fileName.replace(/\.[^/.]+$/, ""),
      fileKey,
      genre: getField("genre") || null,
      mood: getField("mood") || null,
      bpm: getField("bpm") ? parseInt(getField("bpm")!) : null,
      durationSeconds: getField("duration") ? parseInt(getField("duration")!) : null,
      isUploaded: true,
    }).returning();

    return reply.status(201).send(entry[0]);
  });

  app.get("/api/audio/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await db.select().from(audioCatalog)
      .where(sql`${audioCatalog.id} = ${id} AND ${audioCatalog.tenantId} = ${request.tenantId}`)
      .limit(1);

    if (!entry[0]) {
      return reply.status(404).send({ error: "Audio not found" });
    }

    const r2 = createR2Client();
    const signedUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: entry[0].fileKey,
      }),
      { expiresIn: 3600 },
    );

    return reply.send({ ...entry[0], signedUrl });
  });

  app.delete("/api/audio/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const entry = await db.select().from(audioCatalog)
      .where(sql`${audioCatalog.id} = ${id} AND ${audioCatalog.tenantId} = ${request.tenantId}`)
      .limit(1);

    if (!entry[0]) {
      return reply.status(404).send({ error: "Audio not found" });
    }

    const r2 = createR2Client();
    await r2.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: entry[0].fileKey,
    }));

    await db.delete(audioCatalog).where(eq(audioCatalog.id, id));
    return reply.send({ success: true });
  });

  app.patch("/api/audio/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      genre?: string;
      mood?: string;
      bpm?: number;
    };

    const updated = await db.update(audioCatalog)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.genre !== undefined ? { genre: body.genre } : {}),
        ...(body.mood !== undefined ? { mood: body.mood } : {}),
        ...(body.bpm !== undefined ? { bpm: body.bpm } : {}),
        updatedAt: new Date(),
      })
      .where(sql`${audioCatalog.id} = ${id} AND ${audioCatalog.tenantId} = ${request.tenantId}`)
      .returning();

    if (!updated[0]) {
      return reply.status(404).send({ error: "Audio not found" });
    }
    return reply.send(updated[0]);
  });
}
