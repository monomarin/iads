import { NextRequest, NextResponse } from "next/server";

function emptyResponse(path: string) {
  if (path.startsWith("analytics/overview") || path.startsWith("campaigns")) {
    return NextResponse.json({ overview: { totalPlays: 0, uniqueListeners: 0, avgListenDuration: 0, stores: 0, activeNodes: 0, campaigns: 0, engagementRate: 72, audioQuality: 94, lastSync: null, revenue: 0 } });
  }
  if (path.startsWith("analytics/daily")) {
    return NextResponse.json({ daily: [] });
  }
  if (path.startsWith("analytics/stores")) {
    return NextResponse.json({ stores: [] });
  }
  if (path.startsWith("analytics/campaigns")) {
    return NextResponse.json({ campaigns: [] });
  }
  if (path.startsWith("analytics/heatmap")) {
    return NextResponse.json({ heatmap: Array.from({ length: 24 }, (_, i) => ({ hour: i, plays: Math.floor(Math.random() * 100), intensity: "low" })), date: new Date().toISOString().slice(0, 10) });
  }
  if (path.startsWith("campaigns")) {
    return NextResponse.json({ campaigns: [] });
  }
  if (path.startsWith("audio")) {
    return NextResponse.json({ tracks: [] });
  }
  if (path.startsWith("audio-audit")) {
    return NextResponse.json({ issues: [], stats: { total: 0, passed: 0, failed: 0 } });
  }
  if (path.startsWith("playlists")) {
    return NextResponse.json({ playlists: [] });
  }
  if (path.startsWith("stores")) {
    return NextResponse.json({ stores: [] });
  }
  if (path.startsWith("sync")) {
    return NextResponse.json({ logs: [], status: "idle", schedule: null });
  }
  if (path.startsWith("edge-nodes")) {
    return NextResponse.json({ nodes: [] });
  }
  if (path.startsWith("reports")) {
    return NextResponse.json({ templates: [], instances: [], report: null });
  }
  if (path.startsWith("approvals")) {
    return NextResponse.json({ requests: [], stats: { pending: 0, approved: 0, rejected: 0 }, request: null });
  }
  if (path.startsWith("backups")) {
    return NextResponse.json({ config: { retentionDays: 30, frequency: "daily", time: "02:00" }, logs: [] });
  }
  if (path.startsWith("mcp")) {
    return NextResponse.json({ actions: [] });
  }
  if (path.startsWith("brand-safety")) {
    return NextResponse.json({ logs: [], rules: [] });
  }
  if (path.startsWith("billing")) {
    return NextResponse.json({ plan: { id: "free", name: "Free", price: 0 }, current: { plan: "free", status: "active", renewsAt: null }, invoices: [], plans: [{ id: "free", name: "Free", price: 0, features: [] }] });
  }
  if (path.startsWith("notifications")) {
    return NextResponse.json({ notifications: [], preferences: { in_app: true, email: true, push: false }, unreadCount: 0 });
  }
  if (path.startsWith("developer")) {
    return NextResponse.json({ keys: [], webhooks: [] });
  }
  if (path.startsWith("integrations")) {
    return NextResponse.json({ integrations: [], logs: [] });
  }
  if (path.startsWith("advertisers")) {
    return NextResponse.json({ campaigns: [], segments: [], estimate: { reach: 0, cost: 0 } });
  }
  if (path.startsWith("tenants")) {
    return NextResponse.json({ tenant: null, deprovisionStatus: null });
  }
  if (path.startsWith("onboarding")) {
    return NextResponse.json({ progress: { step: 1, completed: false } });
  }
  if (path.startsWith("invitations")) {
    return NextResponse.json({ invitation: null });
  }

  return NextResponse.json({ data: null });
}

export async function GET(_request: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = params.slug?.join("/") ?? "";
  try {
    return emptyResponse(path);
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
