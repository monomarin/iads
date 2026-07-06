import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tenants } from "./schema/tenants";
import { stores } from "./schema/stores";
import { users } from "./schema/users";
import { onboardingProgress } from "./schema/onboarding";
import { tenantInvitations } from "./schema/invitations";
import { campaigns } from "./schema/campaigns";
import { audioVariants } from "./schema/audio-variants";
import { audioCatalog } from "./schema/audio-catalog";
import { playlists, playlistTracks } from "./schema/playlists";
import { edgeNodes } from "./schema/edge-nodes";
import { syncLogs } from "./schema/sync-logs";
import { syncSchedule } from "./schema/sync-schedule";
import { reportTemplates } from "./schema/report-templates";
import { reportInstances } from "./schema/report-instances";
import { approvalRequests } from "./schema/approval-requests";
import { approvalAudit } from "./schema/approval-audit";
import { audioAuditLogs } from "./schema/audio-audit";
import { brandSafetyLogs, brandSafetyRules } from "./schema/brand-safety";
import { advertisers, adCampaigns } from "./schema/ad-campaigns";
import { analyticsDaily } from "./schema/analytics";
import { subscriptionPlans, tenantSubscriptions, invoices } from "./schema/billing";
import { notifications, notificationPreferences } from "./schema/notifications";
import { apiKeys, webhooks } from "./schema/developer";
import { integrations, integrationLogs } from "./schema/integrations";
import { mcpActions } from "./schema/mcp-actions";
import { backupConfig, backupLogs } from "./schema/backup-config";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/raemonorepo";

const client = postgres(connectionString);

export const db = drizzle(client, {
  schema: { tenants, stores, users, onboardingProgress, tenantInvitations, campaigns, audioVariants, audioCatalog, playlists, playlistTracks, edgeNodes, syncLogs, syncSchedule, reportTemplates, reportInstances, approvalRequests, approvalAudit, audioAuditLogs, mcpActions, backupConfig, backupLogs, brandSafetyLogs, brandSafetyRules, advertisers, adCampaigns, analyticsDaily, subscriptionPlans, tenantSubscriptions, invoices, notifications, notificationPreferences, apiKeys, webhooks, integrations, integrationLogs },
});

export { tenants, stores, users, onboardingProgress, tenantInvitations, campaigns, audioVariants, audioCatalog, playlists, playlistTracks, edgeNodes, syncLogs, syncSchedule, reportTemplates, reportInstances, approvalRequests, approvalAudit, audioAuditLogs, mcpActions, backupConfig, backupLogs, brandSafetyLogs, brandSafetyRules, advertisers, adCampaigns, analyticsDaily, subscriptionPlans, tenantSubscriptions, invoices, notifications, notificationPreferences, apiKeys, webhooks, integrations, integrationLogs };
export { rlsPoliciesSql, rlsSetSessionSql } from "./rls";
