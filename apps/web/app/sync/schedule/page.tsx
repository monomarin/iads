"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

const PRESETS = [
  { label: "Every night at 2 AM", cron: "0 2 * * *" },
  { label: "Every night at 3 AM", cron: "0 3 * * *" },
  { label: "Every 6 hours", cron: "0 */6 * * *" },
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Custom", cron: "" },
];

interface Schedule {
  id: string;
  cron_expression: string;
  timezone: string;
  is_active: boolean;
  override_global: boolean;
  updated_at: string;
}

export default function SyncSchedulePage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [cronExpression, setCronExpression] = useState("0 2 * * *");
  const [timezone, setTimezone] = useState("UTC");
  const [isActive, setIsActive] = useState(true);
  const [overrideGlobal, setOverrideGlobal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadSchedule();
  }, [isSignedIn]);

  async function loadSchedule() {
    const token = (await getToken()) || undefined;
    const data = await api.get("/sync/schedule", token);
    const sched = data.schedule as Schedule | null;
    if (sched) {
      setSchedule(sched);
      setCronExpression(sched.cron_expression);
      setTimezone(sched.timezone);
      setIsActive(sched.is_active);
      setOverrideGlobal(sched.override_global);
      if (!sched.override_global) {
        setSelectedPreset(PRESETS.findIndex((p) => p.cron === sched.cron_expression));
      }
    }
  }

  async function saveSchedule() {
    const token = (await getToken()) || undefined;
    await api.put("/sync/schedule", {
      cronExpression,
      timezone,
      isActive,
      overrideGlobal,
    }, token);
    setMessage("Schedule saved");
    await loadSchedule();
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Sync Schedule</h1>
          <Button variant="outline" onClick={() => router.push("/sync")}>Back</Button>
        </div>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-medium">Global Schedule</h2>

          <div className="mb-6 flex flex-wrap gap-2">
            {PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => {
                  setSelectedPreset(i);
                  if (preset.cron) setCronExpression(preset.cron);
                }}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  selectedPreset === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted-foreground">Cron Expression</label>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              placeholder="0 2 * * *"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm text-muted-foreground">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            >
              {["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Madrid", "Asia/Tokyo"].map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="isActive" className="text-sm text-foreground">Active</label>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <input
              type="checkbox"
              id="overrideGlobal"
              checked={overrideGlobal}
              onChange={(e) => setOverrideGlobal(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="overrideGlobal" className="text-sm text-foreground">Override per store</label>
          </div>

          {message && (
            <p className="mb-4 text-sm text-success">{message}</p>
          )}

          <Button onClick={saveSchedule}>Save Schedule</Button>
        </Card>

        {schedule && (
          <p className="mt-4 text-xs text-muted-foreground">
            Last updated: {new Date(schedule.updated_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
