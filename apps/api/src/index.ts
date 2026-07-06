import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { webhookRoutes } from "./routes/webhooks";
import { tenantRoutes } from "./routes/tenants";
import { onboardingRoutes } from "./routes/onboarding";
import { invitationRoutes } from "./routes/invitations";
import { campaignRoutes } from "./routes/campaigns";

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

  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
    console.log(`API running on http://localhost:4000`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
