import { NextRequest, NextResponse } from "next/server";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function demoResponse(path: string) {
  if (path.startsWith("campaigns")) {
    return NextResponse.json({
      campaigns: [
        { id: "demo-campaign-1", name: "Summer Promotion", status: "active", storeName: "Downtown", startDate: daysAgo(14), endDate: daysAgo(-14), goal: "Increase foot traffic by 15%" },
        { id: "demo-campaign-2", name: "New Product Launch", status: "scheduled", storeName: "Downtown", startDate: daysAgo(-7), endDate: daysAgo(-37), goal: "Brand awareness" },
        { id: "demo-campaign-3", name: "Holiday Season", status: "draft", storeName: "Downtown", startDate: daysAgo(-60), endDate: daysAgo(-90), goal: "Maximize sales" },
      ],
    });
  }

  if (path.startsWith("analytics/daily")) {
    const daily = Array.from({ length: 30 }, (_, i) => {
      const dayOfWeek = new Date(daysAgo(29 - i)).getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.4 : 1.0;
      const plays = Math.round(850 * weekendMultiplier * (0.85 + Math.random() * 0.3));
      return {
        date: daysAgo(29 - i).slice(0, 10),
        totalPlays: plays,
        uniqueListeners: Math.round(plays * (0.3 + Math.random() * 0.2)),
        avgListenDurationSec: Math.round(90 + Math.random() * 60),
        engagementRate: 72,
        audioQuality: 94,
      };
    });
    return NextResponse.json({ daily });
  }

  if (path.startsWith("analytics/stores")) {
    return NextResponse.json({
      stores: [
        { id: "demo-store-1", name: "Downtown", address: "123 Main St", totalPlays: randomInt(5000, 15000), uniqueListeners: randomInt(500, 2000), avgDuration: randomInt(60, 180), nodes: 2, onlineNodes: 1, lastSync: daysAgo(0) },
      ],
    });
  }

  if (path.startsWith("analytics/campaigns")) {
    return NextResponse.json({
      campaigns: [
        { id: "demo-campaign-1", name: "Summer Promotion", status: "active", plays: randomInt(2000, 5000), impressions: randomInt(5000, 10000), reach: randomInt(500, 2000), lastSync: daysAgo(0) },
        { id: "demo-campaign-2", name: "New Product Launch", status: "scheduled", plays: 0, impressions: 0, reach: 0, lastSync: null },
      ],
    });
  }

  if (path.startsWith("analytics/heatmap")) {
    return NextResponse.json({
      heatmap: Array.from({ length: 24 }, (_, i) => ({ hour: i, plays: Math.floor(Math.random() * 100), intensity: i < 6 ? "low" : i < 12 ? "medium" : i < 18 ? "high" : "medium" })),
      date: new Date().toISOString().slice(0, 10),
    });
  }

  if (path.startsWith("audio")) {
    return NextResponse.json({
      tracks: [
        { id: "demo-audio-1", name: "Upbeat Summer Mix", durationSeconds: 180, genre: "pop", mood: "energetic", bpm: 128, isUploaded: true, createdAt: daysAgo(30) },
        { id: "demo-audio-2", name: "Relaxed Morning", durationSeconds: 240, genre: "ambient", mood: "calm", bpm: 72, isUploaded: true, createdAt: daysAgo(25) },
        { id: "demo-audio-3", name: "Energetic Workout", durationSeconds: 200, genre: "electronic", mood: "energetic", bpm: 140, isUploaded: true, createdAt: daysAgo(20) },
        { id: "demo-audio-4", name: "Jazz Evening", durationSeconds: 300, genre: "jazz", mood: "relaxed", bpm: 90, isUploaded: true, createdAt: daysAgo(15) },
      ],
    });
  }

  if (path.startsWith("audio-audit")) {
    return NextResponse.json({
      issues: [],
      stats: { total: 4, passed: 4, failed: 0 },
    });
  }

  if (path.startsWith("playlists")) {
    return NextResponse.json({
      playlists: [
        { id: "demo-playlist-1", name: "Weekend Rotation", description: "Upbeat tracks for weekend shoppers", isActive: true, trackCount: 2, createdAt: daysAgo(20) },
        { id: "demo-playlist-2", name: "Morning Calm", description: "Relaxed tracks for morning hours", isActive: true, trackCount: 1, createdAt: daysAgo(15) },
      ],
    });
  }

  if (path.startsWith("stores")) {
    return NextResponse.json({
      stores: [
        { id: "demo-store-1", name: "Downtown", address: "123 Main St, City", timezone: "America/New_York", syncSchedule: "0 2 * * *", nodeCount: 2, onlineNodes: 1, createdAt: daysAgo(60) },
      ],
    });
  }

  if (path.startsWith("sync")) {
    return NextResponse.json({
      logs: Array.from({ length: 7 }, (_, i) => ({
        id: `demo-sync-${i}`,
        status: "success",
        type: "scheduled",
        startedAt: daysAgo(i),
        finishedAt: daysAgo(i).replace("T", "T").slice(0, 10) + "T" + (i < 6 ? "04" : "06") + ":00:00.000Z",
        itemsSynced: randomInt(10, 50),
        itemsFailed: 0,
      })),
      status: "success",
      schedule: { time: "02:00", frequency: "daily", timezone: "America/New_York" },
    });
  }

  if (path.startsWith("edge-nodes")) {
    return NextResponse.json({
      nodes: [
        { id: "demo-node-1", name: "Main Floor Node", storeName: "Downtown", isOnline: true, platform: "android", firmwareVersion: "2.1.0", lastSeenAt: daysAgo(0), volume: 75, ambientControl: true },
        { id: "demo-node-2", name: "Back Office Node", storeName: "Downtown", isOnline: false, platform: "android", firmwareVersion: "2.0.5", lastSeenAt: daysAgo(1), volume: 50, ambientControl: false },
      ],
    });
  }

  if (path.startsWith("reports")) {
    return NextResponse.json({
      templates: [
        { id: "tpl-ceo", name: "CEO Report", description: "High-level metrics", category: "ceo", isBuiltin: true },
        { id: "tpl-tech", name: "Technical Report", description: "System health metrics", category: "technical", isBuiltin: true },
      ],
      instances: [],
      report: null,
    });
  }

  if (path.startsWith("approvals")) {
    return NextResponse.json({
      requests: [
        { id: "apr-1", action: "create_campaign", targetType: "campaign", targetName: "Fall Sale", status: "pending", requestedBy: "admin@demo.com", createdAt: daysAgo(0) },
        { id: "apr-2", action: "update_playlist", targetType: "playlist", targetName: "Weekend Rotation V2", status: "approved", requestedBy: "admin@demo.com", reviewedBy: "admin@demo.com", reviewComment: "Looks good", reviewedAt: daysAgo(1), createdAt: daysAgo(2) },
      ],
      stats: { pending: 1, approved: 1, rejected: 0 },
      request: null,
    });
  }

  if (path.startsWith("backups")) {
    return NextResponse.json({
      config: { retentionDays: 30, frequency: "daily", time: "02:00" },
      logs: Array.from({ length: 5 }, (_, i) => ({
        id: `demo-bk-${i}`,
        status: "success",
        size: `${randomInt(10, 100)} MB`,
        startedAt: daysAgo(i * 7),
        finishedAt: daysAgo(i * 7).replace("T", "T").slice(0, 10) + "T03:00:00.000Z",
      })),
    });
  }

  if (path.startsWith("mcp")) {
    return NextResponse.json({
      actions: [
        { action: "list_campaigns", label: "List Campaigns", enabled: true },
        { action: "get_analytics", label: "Get Analytics", enabled: true },
        { action: "create_campaign", label: "Create Campaign", enabled: true },
        { action: "update_playlist", label: "Update Playlist", enabled: true },
        { action: "sync_store", label: "Sync Store", enabled: true },
        { action: "list_stores", label: "List Stores", enabled: true },
        { action: "list_audio", label: "List Audio Tracks", enabled: true },
        { action: "send_notification", label: "Send Notification", enabled: true },
      ],
    });
  }

  if (path.startsWith("brand-safety")) {
    return NextResponse.json({
      logs: [],
      rules: [
        { type: "blacklist", words: ["violence", "explicit", "political"], action: "block" },
        { type: "tone", minScore: 0.3, action: "flag" },
        { type: "compliance", standards: ["ada"], action: "require" },
      ],
    });
  }

  if (path.startsWith("billing")) {
    return NextResponse.json({
      plan: { id: "plan-growth", name: "Growth Plan", price: 99 },
      current: { plan: "growth", status: "active", renewsAt: daysAgo(-30) },
      invoices: [
        { id: "inv-1", amount: "99.00", currency: "usd", status: "paid", paidAt: daysAgo(30) },
        { id: "inv-2", amount: "99.00", currency: "usd", status: "paid", paidAt: daysAgo(60) },
        { id: "inv-3", amount: "99.00", currency: "usd", status: "paid", paidAt: daysAgo(90) },
      ],
      plans: [
        { id: "free", name: "Free", price: 0, maxStores: 1, maxPlays: 10000, features: ["basic_analytics"] },
        { id: "growth", name: "Growth", price: 99, maxStores: 10, maxPlays: 100000, features: ["analytics", "multi_store", "api_access", "priority_support"] },
        { id: "enterprise", name: "Enterprise", price: 299, maxStores: 100, maxPlays: 1000000, features: ["analytics", "multi_store", "api_access", "priority_support", "custom_branding", "dedicated_support"] },
      ],
    });
  }

  if (path.startsWith("notifications")) {
    return NextResponse.json({
      notifications: [
        { id: "notif-1", type: "sync_complete", title: "Sync Completed", message: "Main store sync completed. 42 items synced.", isRead: false, channel: "in_app", createdAt: daysAgo(0) },
        { id: "notif-2", type: "campaign_active", title: "Campaign Now Active", message: "Summer Promotion campaign is now live.", isRead: false, channel: "in_app", createdAt: daysAgo(1) },
        { id: "notif-3", type: "node_offline", title: "Node Offline", message: "Back Office Node has been offline for 24 hours.", isRead: true, channel: "in_app", createdAt: daysAgo(2) },
      ],
      preferences: { in_app: true, email: true, push: false },
      unreadCount: 2,
    });
  }

  if (path.startsWith("developer")) {
    return NextResponse.json({
      keys: [
        { id: "key-1", name: "Production API Key", key: "rae_prod_**********", lastUsed: daysAgo(1), createdAt: daysAgo(90) },
      ],
      webhooks: [
        { id: "wh-1", name: "Sync Events", url: "https://example.com/webhooks/sync", events: ["sync.completed", "sync.failed"], isActive: true },
      ],
    });
  }

  if (path.startsWith("integrations")) {
    return NextResponse.json({
      integrations: [
        { id: "int-1", name: "Slack", type: "notification", isConnected: true, config: { channel: "#alerts" } },
        { id: "int-2", name: "Custom Webhook", type: "webhook", isConnected: true, config: { url: "https://example.com/hook" } },
      ],
      logs: [],
    });
  }

  if (path.startsWith("advertisers")) {
    return NextResponse.json({
      campaigns: [
        { id: "ad-camp-1", name: "Summer Ad Blast", status: "active", budget: 5000, spent: 3200, impressions: 15000, clicks: 450 },
      ],
      segments: [
        { id: "seg-1", name: "Weekend Shoppers", description: "Customers who shop on weekends", size: 2500 },
      ],
      estimate: { reach: 5000, cost: 2500 },
    });
  }

  if (path.startsWith("tenants")) {
    return NextResponse.json({
      tenant: { id: "demo-tenant", name: "Demo Store", slug: "demo-store" },
      deprovisionStatus: null,
    });
  }

  if (path.startsWith("onboarding")) {
    return NextResponse.json({
      progress: { step: 0, completed: true, data: { name: "Demo Store", address: "123 Main St" } },
    });
  }

  if (path.startsWith("invitations")) {
    return NextResponse.json({ invitation: null });
  }

  return NextResponse.json({ data: null });
}

export async function GET(_request: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = params.slug?.join("/") ?? "";
  try {
    return demoResponse(path);
  } catch {
    return NextResponse.json({ data: null });
  }
}

export async function POST(_request: NextRequest, _context: { params: { slug: string[] } }) {
  return NextResponse.json({ success: true });
}

export async function PUT(_request: NextRequest, _context: { params: { slug: string[] } }) {
  return NextResponse.json({ success: true });
}

export async function PATCH(_request: NextRequest, _context: { params: { slug: string[] } }) {
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, _context: { params: { slug: string[] } }) {
  return NextResponse.json({ success: true });
}
