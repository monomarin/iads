import { db } from "../index";
import { tenants } from "../schema/tenants";
import { stores } from "../schema/stores";
import { users } from "../schema/users";
import { onboardingProgress } from "../schema/onboarding";
import { campaigns } from "../schema/campaigns";
import { edgeNodes } from "../schema/edge-nodes";
import { syncLogs } from "../schema/sync-logs";
import { analyticsDaily } from "../schema/analytics";
import { audioCatalog } from "../schema/audio-catalog";
import { playlists, playlistTracks } from "../schema/playlists";
import { subscriptionPlans, tenantSubscriptions, invoices } from "../schema/billing";
import { backupConfig } from "../schema/backup-config";
import { mcpActions } from "../schema/mcp-actions";
import { brandSafetyRules } from "../schema/brand-safety";
import { notifications, notificationPreferences } from "../schema/notifications";
import { approvalRequests } from "../schema/approval-requests";
import { rlsPoliciesSql } from "../rls";
import { seedReportTemplates } from "./report-templates";

const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000002";
const DEMO_STORE_ID = "00000000-0000-0000-0000-000000000003";
const DEMO_CAMPAIGN_ID = "00000000-0000-0000-0000-000000000010";
const DEMO_AUDIO_1 = "00000000-0000-0000-0000-000000000020";
const DEMO_AUDIO_2 = "00000000-0000-0000-0000-000000000021";
const DEMO_AUDIO_3 = "00000000-0000-0000-0000-000000000022";
const DEMO_AUDIO_4 = "00000000-0000-0000-0000-000000000023";
const DEMO_PLAYLIST_ID = "00000000-0000-0000-0000-000000000030";
const DEMO_NODE_1 = "00000000-0000-0000-0000-000000000040";
const DEMO_NODE_2 = "00000000-0000-0000-0000-000000000041";
const DEMO_PLAN_ID = "00000000-0000-0000-0000-000000000050";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function seed() {
  // Apply RLS policies
  for (const statement of rlsPoliciesSql.split(";").filter(Boolean)) {
    await db.execute(statement);
  }

  // ===== TENANT =====
  await db.insert(tenants).values({
    id: DEMO_TENANT_ID,
    name: "Demo Store",
    slug: "demo-store",
  }).onConflictDoNothing();

  // ===== STORE =====
  await db.insert(stores).values({
    id: DEMO_STORE_ID,
    tenantId: DEMO_TENANT_ID,
    name: "Demo Store - Downtown",
    address: "123 Main St, City",
    timezone: "America/New_York",
    syncSchedule: "0 2 * * *",
  }).onConflictDoNothing();

  // ===== USER =====
  await db.insert(users).values({
    id: DEMO_USER_ID,
    clerkId: "demo_clerk_id",
    tenantId: DEMO_TENANT_ID,
    email: "admin@demo.com",
    role: "super_admin",
  }).onConflictDoNothing();

  // ===== ONBOARDING =====
  await db.insert(onboardingProgress).values({
    userId: DEMO_USER_ID,
    step: 0,
    completed: true,
    data: { name: "Demo Store - Downtown", address: "123 Main St, City" },
  }).onConflictDoNothing();

  // ===== SUBSCRIPTION PLAN =====
  await db.insert(subscriptionPlans).values({
    id: DEMO_PLAN_ID,
    name: "Growth Plan",
    price: "99.00",
    maxStores: 10,
    maxPlays: 100000,
    features: ["analytics", "multi_store", "api_access", "priority_support", "custom_branding"],
    isActive: true,
  }).onConflictDoNothing();

  // ===== TENANT SUBSCRIPTION =====
  await db.insert(tenantSubscriptions).values({
    tenantId: DEMO_TENANT_ID,
    planId: DEMO_PLAN_ID,
    status: "active",
    currentPeriodStart: daysAgo(30),
    currentPeriodEnd: daysAgo(-30),
  }).onConflictDoNothing();

  // ===== INVOICES =====
  const now = new Date();
  for (let i = 1; i <= 3; i++) {
    const invDate = new Date(now);
    invDate.setMonth(invDate.getMonth() - i);
    await db.insert(invoices).values({
      tenantId: DEMO_TENANT_ID,
      amount: "99.00",
      currency: "usd",
      status: "paid",
      paidAt: invDate,
    }).onConflictDoNothing();
  }

  // ===== CAMPAIGNS =====
  await db.insert(campaigns).values({
    id: DEMO_CAMPAIGN_ID,
    tenantId: DEMO_TENANT_ID,
    storeId: DEMO_STORE_ID,
    name: "Summer Promotion",
    status: "active",
    startDate: daysAgo(14),
    endDate: daysAgo(-14),
    goal: "Increase foot traffic by 15%",
    notes: "Targeting weekend shoppers with upbeat music",
  }).onConflictDoNothing();

  await db.insert(campaigns).values({
    tenantId: DEMO_TENANT_ID,
    storeId: DEMO_STORE_ID,
    name: "New Product Launch",
    status: "scheduled",
    startDate: daysAgo(-7),
    endDate: daysAgo(-37),
    goal: "Brand awareness for new product line",
  }).onConflictDoNothing();

  await db.insert(campaigns).values({
    tenantId: DEMO_TENANT_ID,
    storeId: DEMO_STORE_ID,
    name: "Holiday Season",
    status: "draft",
    startDate: daysAgo(-60),
    endDate: daysAgo(-90),
    goal: "Maximize holiday sales",
  }).onConflictDoNothing();

  // ===== AUDIO CATALOG =====
  await db.insert(audioCatalog).values([
    {
      id: DEMO_AUDIO_1,
      tenantId: DEMO_TENANT_ID,
      name: "Upbeat Summer Mix",
      fileKey: "demo/upbeat-summer.mp3",
      durationSeconds: 180,
      genre: "pop",
      mood: "energetic",
      bpm: 128,
      isUploaded: true,
    },
    {
      id: DEMO_AUDIO_2,
      tenantId: DEMO_TENANT_ID,
      name: "Relaxed Morning",
      fileKey: "demo/relaxed-morning.mp3",
      durationSeconds: 240,
      genre: "ambient",
      mood: "calm",
      bpm: 72,
      isUploaded: true,
    },
    {
      id: DEMO_AUDIO_3,
      tenantId: DEMO_TENANT_ID,
      name: "Energetic Workout",
      fileKey: "demo/energetic-workout.mp3",
      durationSeconds: 200,
      genre: "electronic",
      mood: "energetic",
      bpm: 140,
      isUploaded: true,
    },
    {
      id: DEMO_AUDIO_4,
      tenantId: DEMO_TENANT_ID,
      name: "Jazz Evening",
      fileKey: "demo/jazz-evening.mp3",
      durationSeconds: 300,
      genre: "jazz",
      mood: "relaxed",
      bpm: 90,
      isUploaded: true,
    },
  ]).onConflictDoNothing();

  // ===== PLAYLISTS =====
  await db.insert(playlists).values({
    id: DEMO_PLAYLIST_ID,
    tenantId: DEMO_TENANT_ID,
    name: "Weekend Rotation",
    description: "Upbeat tracks for weekend shoppers",
    rules: { genres: ["pop", "electronic"], maxBpm: 140, minBpm: 100 },
    isActive: true,
  }).onConflictDoNothing();

  await db.insert(playlists).values({
    tenantId: DEMO_TENANT_ID,
    name: "Morning Calm",
    description: "Relaxed tracks for morning hours",
    rules: { genres: ["ambient", "jazz"], maxBpm: 100, minBpm: 60 },
    isActive: true,
  }).onConflictDoNothing();

  // ===== PLAYLIST TRACKS =====
  await db.insert(playlistTracks).values([
    { playlistId: DEMO_PLAYLIST_ID, trackId: DEMO_AUDIO_1, position: 0 },
    { playlistId: DEMO_PLAYLIST_ID, trackId: DEMO_AUDIO_3, position: 1 },
  ]).onConflictDoNothing();

  // ===== EDGE NODES =====
  await db.insert(edgeNodes).values([
    {
      id: DEMO_NODE_1,
      storeId: DEMO_STORE_ID,
      name: "Main Floor Node",
      deviceToken: "device-token-001",
      platform: "android",
      fcmToken: "fcm-token-001",
      lastSeenAt: new Date(),
      firmwareVersion: "2.1.0",
      settings: { volume: 75, ambientControl: true, fadeDuration: 3 },
      isOnline: true,
    },
    {
      id: DEMO_NODE_2,
      storeId: DEMO_STORE_ID,
      name: "Back Office Node",
      deviceToken: "device-token-002",
      platform: "android",
      lastSeenAt: daysAgo(1),
      firmwareVersion: "2.0.5",
      settings: { volume: 50, ambientControl: false },
      isOnline: false,
    },
  ]).onConflictDoNothing();

  // ===== SYNC LOGS =====
  for (let i = 0; i < 7; i++) {
    const syncDate = daysAgo(i);
    const finishedAt = new Date(syncDate);
    finishedAt.setHours(finishedAt.getHours() + 2);
    await db.insert(syncLogs).values({
      storeId: DEMO_STORE_ID,
      status: "success",
      type: "scheduled",
      startedAt: syncDate,
      finishedAt,
      itemsSynced: Math.floor(Math.random() * 50) + 10,
      itemsFailed: 0,
    }).onConflictDoNothing();
  }

  // ===== ANALYTICS DAILY (30 days) =====
  const basePlays = 850;
  for (let i = 29; i >= 0; i--) {
    const day = daysAgo(i);
    const dayOfWeek = day.getDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.4 : 1.0;
    const noise = 0.85 + Math.random() * 0.3;
    const plays = Math.round(basePlays * weekendMultiplier * noise);
    const listeners = Math.round(plays * (0.3 + Math.random() * 0.2));
    const avgDuration = Math.round(90 + Math.random() * 60);

    await db.insert(analyticsDaily).values({
      tenantId: DEMO_TENANT_ID,
      storeId: DEMO_STORE_ID,
      date: formatDate(day),
      totalPlays: plays,
      uniqueListeners: listeners,
      avgListenDurationSec: avgDuration,
    }).onConflictDoNothing();
  }

  // ===== BACKUP CONFIG =====
  await db.insert(backupConfig).values({
    tenantId: DEMO_TENANT_ID,
    retentionDays: 30,
    frequency: "daily",
    time: "02:00",
  }).onConflictDoNothing();

  // ===== MCP ACTIONS =====
  const defaultActions = [
    { action: "list_campaigns", label: "List Campaigns" },
    { action: "get_analytics", label: "Get Analytics" },
    { action: "create_campaign", label: "Create Campaign" },
    { action: "update_playlist", label: "Update Playlist" },
    { action: "sync_store", label: "Sync Store" },
    { action: "list_stores", label: "List Stores" },
    { action: "list_audio", label: "List Audio Tracks" },
    { action: "send_notification", label: "Send Notification" },
  ];
  for (const a of defaultActions) {
    await db.insert(mcpActions).values({
      tenantId: DEMO_TENANT_ID,
      action: a.action,
      label: a.label,
      enabled: true,
    }).onConflictDoNothing();
  }

  // ===== BRAND SAFETY RULES =====
  await db.insert(brandSafetyRules).values({
    tenantId: DEMO_TENANT_ID,
    country: "US",
    rules: [
      { type: "blacklist", words: ["violence", "explicit", "political"], action: "block" },
      { type: "tone", minScore: 0.3, action: "flag" },
      { type: "compliance", standards: ["ada"], action: "require" },
    ],
  }).onConflictDoNothing();

  // ===== NOTIFICATIONS =====
  await db.insert(notifications).values([
    {
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_USER_ID,
      type: "sync_complete",
      title: "Sync Completed",
      message: "Main store sync completed successfully. 42 items synced.",
      isRead: false,
      channel: "in_app",
    },
    {
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_USER_ID,
      type: "campaign_active",
      title: "Campaign Now Active",
      message: "Summer Promotion campaign is now live across all nodes.",
      isRead: false,
      channel: "in_app",
    },
    {
      tenantId: DEMO_TENANT_ID,
      userId: DEMO_USER_ID,
      type: "node_offline",
      title: "Node Offline",
      message: "Back Office Node has been offline for 24 hours.",
      isRead: true,
      channel: "in_app",
    },
  ]).onConflictDoNothing();

  await db.insert(notificationPreferences).values({
    userId: DEMO_USER_ID,
    channel: "in_app",
    enabled: true,
    types: ["sync_complete", "campaign_active", "node_offline", "approval_needed", "error"],
  }).onConflictDoNothing();

  // ===== APPROVAL REQUESTS =====
  await db.insert(approvalRequests).values([
    {
      tenantId: DEMO_TENANT_ID,
      requestedBy: DEMO_USER_ID,
      action: "create_campaign",
      targetType: "campaign",
      targetId: "pending-campaign-001",
      payload: { name: "Fall Sale", budget: 5000, startDate: daysAgo(-7).toISOString() },
      status: "pending",
    },
    {
      tenantId: DEMO_TENANT_ID,
      requestedBy: DEMO_USER_ID,
      action: "update_playlist",
      targetType: "playlist",
      targetId: DEMO_PLAYLIST_ID,
      payload: { name: "Weekend Rotation V2", description: "Updated weekend playlist" },
      status: "approved",
      reviewedBy: DEMO_USER_ID,
      reviewComment: "Looks good, approved.",
      reviewedAt: daysAgo(1),
    },
  ]).onConflictDoNothing();

  // ===== REPORT TEMPLATES =====
  await seedReportTemplates(DEMO_TENANT_ID);

  console.log("Seed complete: all demo data created successfully.");
}

seed().catch(console.error);
