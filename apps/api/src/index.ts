import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { webhookRoutes } from "./routes/webhooks";
import { tenantRoutes } from "./routes/tenants";
import { onboardingRoutes } from "./routes/onboarding";
import { invitationRoutes } from "./routes/invitations";
import { campaignRoutes } from "./routes/campaigns";
import { audioRoutes } from "./routes/audio";
import { playlistRoutes } from "./routes/playlists";
import { smartDJRoutes } from "./routes/smartdj";
import { syncRoutes } from "./routes/sync";
import { edgeNodeRoutes } from "./routes/edge-nodes";
import { reportRoutes } from "./routes/reports";
import { approvalRoutes } from "./routes/approvals";
import { deprovisionRoutes } from "./routes/deprovision";
import { audioAuditRoutes } from "./routes/audio-audit";
import { mcpRoutes } from "./routes/mcp";
import { backupRoutes } from "./routes/backups";
import { demoRoutes } from "./routes/demo";
import { ambientRoutes } from "./routes/ambient";
import { brandSafetyRoutes } from "./routes/brand-safety";
import { advertiserRoutes } from "./routes/advertisers";
import { analyticsRoutes } from "./routes/analytics";
import { billingRoutes } from "./routes/billing";
import { notificationRoutes } from "./routes/notifications";
import { developerRoutes } from "./routes/developer";
import { integrationRoutes } from "./routes/integrations";
import { createSyncWorker } from "./services/sync-queue";
import { processDeprovisionQueue, startDeprovisionCron } from "./services/deprovision-worker";
import { db, syncLogs, audioCatalog, playlists, playlistTracks, stores } from "@raemonorepo/db";
import { eq } from "drizzle-orm";

const app = Fastify({
  logger: true,
});

async function main() {
  await app.register(cors, {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max
    },
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Retail Audio Engine API",
        version: "0.0.1",
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  await app.register(webhookRoutes);
  await app.register(tenantRoutes);
  await app.register(onboardingRoutes);
  await app.register(invitationRoutes);
  await app.register(campaignRoutes);
  await app.register(audioRoutes);
  await app.register(playlistRoutes);
  await app.register(smartDJRoutes);
  await app.register(syncRoutes);
  await app.register(edgeNodeRoutes);
  await app.register(reportRoutes);
  await app.register(approvalRoutes);
  await app.register(deprovisionRoutes);
  await app.register(audioAuditRoutes);
  await app.register(mcpRoutes);
  await app.register(backupRoutes);
  await app.register(demoRoutes);
  await app.register(ambientRoutes);
  await app.register(brandSafetyRoutes);
  await app.register(advertiserRoutes);
  await app.register(analyticsRoutes);
  await app.register(billingRoutes);
  await app.register(notificationRoutes);
  await app.register(developerRoutes);
  await app.register(integrationRoutes);

  createSyncWorker(async (job) => {
    if (job.data.type === "deprovision-check") {
      await processDeprovisionQueue();
      return;
    }
    const { storeId, type } = job.data;
    console.log(`Processing sync for store ${storeId}, type: ${type}`);
    const now = new Date();
    await db.insert(syncLogs).values({ storeId: storeId as string, type: type as string, status: "running", startedAt: now });

    const tracks = await db
      .select({ fileKey: audioCatalog.fileKey, name: audioCatalog.name, durationSeconds: audioCatalog.durationSeconds })
      .from(playlistTracks)
      .innerJoin(playlists, eq(playlistTracks.playlistId, playlists.id))
      .innerJoin(audioCatalog, eq(playlistTracks.trackId, audioCatalog.id))
      .where(eq(playlists.tenantId, (await db.select({ tenantId: stores.tenantId }).from(stores).where(eq(stores.id, storeId as string)).limit(1))[0]?.tenantId ?? ""));

    const failed = tracks.filter((t) => !t.fileKey).length;
    const synced = tracks.length - failed;
    await db.update(syncLogs).set({ status: failed > 0 ? "failed" : "success", finishedAt: new Date(), itemsSynced: synced, itemsFailed: failed }).where(eq(syncLogs.startedAt, now));
  });

  await startDeprovisionCron();

  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
    console.log(`API running on http://localhost:4000`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
