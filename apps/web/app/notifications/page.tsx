"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  channel: string;
  createdAt: string;
}

interface Preference {
  id: string;
  channel: string;
  enabled: boolean;
  types: string[];
}

const CHANNEL_LABELS: Record<string, string> = { in_app: "In-App", email: "Email", push: "Push" };
const TYPE_LABELS: Record<string, string> = {
  sync_complete: "Sync Complete", sync_failed: "Sync Failed", campaign_activated: "Campaign Live",
  campaign_ended: "Campaign Ended", approval_requested: "Approval Requested", approval_resolved: "Approval Resolved",
  audio_audit_issue: "Audio Issue", deprovision_warning: "Deprovision Warning", brand_safety_alert: "Brand Safety",
  ambient_threshold: "Ambient Alert", backup_complete: "Backup Complete", billing_receipt: "Receipt",
};

export default function NotificationsPage() {
  const { getToken, isSignedIn } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [prefs, setPrefs] = useState<Preference[]>([]);
  const [unread, setUnread] = useState(0);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    loadAll();
  }, [isSignedIn]);

  async function loadAll() {
    const token = (await getToken()) || undefined;
    const [n, p, u] = await Promise.all([
      api.get("/api/notifications", token),
      api.get("/api/notifications/preferences", token),
      api.get("/api/notifications/unread-count", token),
    ]);
    setNotifs((n as { notifications: Notification[] }).notifications ?? []);
    setPrefs((p as { preferences: Preference[] }).preferences ?? []);
    setUnread((u as { unread: number }).unread);
    setLoading(false);
  }

  async function markRead(id: string) {
    const token = (await getToken()) || undefined;
    await api.put(`/api/notifications/${id}/read`, {}, token);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  async function markAllRead() {
    const token = (await getToken()) || undefined;
    await api.put("/api/notifications/read-all", {}, token);
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  async function togglePref(channel: string, enabled: boolean) {
    const token = (await getToken()) || undefined;
    const updated = prefs.map((p) => (p.channel === channel ? { ...p, enabled } : p));
    await api.put("/api/notifications/preferences", updated.map(({ channel, enabled, types }) => ({ channel, enabled, types })), token);
    setPrefs(updated);
  }

  const filtered = tab === "unread" ? notifs.filter((n) => !n.isRead) : notifs;

  if (loading) {
    return <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mt-20" />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Notifications</h1>

        <div className="mb-6 grid grid-cols-2 gap-6">
          <Card className="p-4">
            <h2 className="mb-4 font-semibold text-foreground">Preferences</h2>
            <div className="space-y-3">
              {prefs.map((pref) => (
                <label key={pref.channel} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{CHANNEL_LABELS[pref.channel] ?? pref.channel}</p>
                    <p className="text-xs text-muted-foreground">
                      {(pref.types as string[]).map((t: string) => TYPE_LABELS[t] ?? t).join(", ") || "No types"}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pref.enabled}
                    onChange={(e) => togglePref(pref.channel, e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-4 font-semibold text-foreground">Summary</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{notifs.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{unread}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{notifs.length - unread}</p>
                <p className="text-xs text-muted-foreground">Read</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("all")}
              className={`rounded-lg px-3 py-1.5 text-sm ${tab === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              All
            </button>
            <button
              onClick={() => setTab("unread")}
              className={`rounded-lg px-3 py-1.5 text-sm ${tab === "unread" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              Unread ({unread})
            </button>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-sm text-primary hover:underline">
              Mark all as read
            </button>
          )}
        </div>

        <div className="space-y-2">
          {filtered.map((n) => (
            <Card
              key={n.id}
              className={`flex cursor-pointer items-start gap-3 p-4 ${!n.isRead ? "border-l-2 border-l-primary" : ""}`}
              onClick={() => !n.isRead && markRead(n.id)}
            >
              <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-muted" : "bg-primary"}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{n.message}</p>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="mt-10 text-center text-muted-foreground">No notifications</div>
          )}
        </div>
      </div>
    </div>
  );
}
