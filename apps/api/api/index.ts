import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import { webhookRoutes } from "../src/routes/webhooks";
import { tenantRoutes } from "../src/routes/tenants";
import { onboardingRoutes } from "../src/routes/onboarding";
import { invitationRoutes } from "../src/routes/invitations";
import { campaignRoutes } from "../src/routes/campaigns";
import { audioRoutes } from "../src/routes/audio";
import { playlistRoutes } from "../src/routes/playlists";
import { smartDJRoutes } from "../src/routes/smartdj";
import { syncRoutes } from "../src/routes/sync";
import { edgeNodeRoutes } from "../src/routes/edge-nodes";
import { reportRoutes } from "../src/routes/reports";
import { approvalRoutes } from "../src/routes/approvals";
import { deprovisionRoutes } from "../src/routes/deprovision";
import { audioAuditRoutes } from "../src/routes/audio-audit";
import { mcpRoutes } from "../src/routes/mcp";
import { backupRoutes } from "../src/routes/backups";
import { demoRoutes } from "../src/routes/demo";
import { ambientRoutes } from "../src/routes/ambient";
import { brandSafetyRoutes } from "../src/routes/brand-safety";
import { advertiserRoutes } from "../src/routes/advertisers";
import { analyticsRoutes } from "../src/routes/analytics";
import { billingRoutes } from "../src/routes/billing";
import { notificationRoutes } from "../src/routes/notifications";
import { developerRoutes } from "../src/routes/developer";
import { integrationRoutes } from "../src/routes/integrations";

let app: ReturnType<typeof Fastify> | null = null;
let ready = false;

async function getApp() {
  if (ready && app) return app;

  const isServerless = true;

  app = Fastify({ logger: false });

  await app.register(cors, {
    origin: process.env.NEXT_PUBLIC_APP_URL || "*",
    credentials: true,
  });

  if (!isServerless) {
    await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  }

  if (!isServerless) {
    await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
  }

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

  await app.ready();
  ready = true;

  return app;
}

export default async function handler(req: any, res: any) {
  try {
    const instance = await getApp();
    instance.server.emit("request", req, res);
  } catch (err) {
    console.error("API handler error:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}
