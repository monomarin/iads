"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Props {
  onComplete: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

const SCHEDULE_PRESETS = [
  { label: "Every night at 2 AM", value: "0 2 * * *" },
  { label: "Every night at 3 AM", value: "0 3 * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Custom", value: "custom" },
];

export function Step2SyncSchedule({ onComplete, onBack }: Props) {
  const { getToken } = useAuth();
  const [selected, setSelected] = useState("0 2 * * *");
  const [customCron, setCustomCron] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const cron = selected === "custom" ? customCron : selected;
    try {
      const token = (await getToken()) || undefined;
      await api.patch(
        "/tenants/current",
        { sync_schedule: cron, timezone },
        token,
      );
      onComplete({ syncSchedule: cron, timezone });
    } catch {
      // Continue even if API fails
      onComplete({ syncSchedule: cron, timezone });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Sync schedule</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure when audio content syncs to your store.
        </p>
      </div>

      <div className="space-y-3">
        {SCHEDULE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setSelected(preset.value)}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              selected === preset.value
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
          >
            <span className="text-sm font-medium text-foreground">{preset.label}</span>
          </button>
        ))}
      </div>

      {selected === "custom" && (
        <div>
          <label htmlFor="cron" className="block text-sm font-medium text-foreground">
            Cron expression
          </label>
          <input
            id="cron"
            type="text"
            value={customCron}
            onChange={(e) => setCustomCron(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="0 2 * * *"
          />
        </div>
      )}

      <div>
        <label htmlFor="tz" className="block text-sm font-medium text-foreground">
          Timezone
        </label>
        <select
          id="tz"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern (US)</option>
          <option value="America/Chicago">Central (US)</option>
          <option value="America/Denver">Mountain (US)</option>
          <option value="America/Los_Angeles">Pacific (US)</option>
          <option value="America/Mexico_City">Mexico City</option>
          <option value="America/Bogota">Bogota</option>
          <option value="Europe/Madrid">Madrid</option>
        </select>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
