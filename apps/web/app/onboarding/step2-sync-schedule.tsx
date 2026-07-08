"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { api } from "@/lib/api";
import { Clock, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  onComplete: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

const SCHEDULE_PRESETS = [
  { label: "Cada noche a las 2:00 AM", description: "Ideal para la mayoría de tiendas", value: "0 2 * * *", recommended: true },
  { label: "Cada noche a las 3:00 AM", description: "Para tiendas con cierre más tardío", value: "0 3 * * *" },
  { label: "Cada 6 horas", description: "Sincronización frecuente", value: "0 */6 * * *" },
  { label: "Cada hora", description: "Alta disponibilidad de contenido", value: "0 * * * *" },
  { label: "Personalizado", description: "Define tu propia expresión cron", value: "custom" },
];

const TIMEZONES = [
  { label: "UTC", value: "UTC" },
  { label: "Mexico City (GMT-6)", value: "America/Mexico_City" },
  { label: "Bogotá (GMT-5)", value: "America/Bogota" },
  { label: "Lima (GMT-5)", value: "America/Lima" },
  { label: "Santiago (GMT-4)", value: "America/Santiago" },
  { label: "Buenos Aires (GMT-3)", value: "America/Argentina/Buenos_Aires" },
  { label: "New York (GMT-5)", value: "America/New_York" },
  { label: "Los Angeles (GMT-8)", value: "America/Los_Angeles" },
  { label: "Madrid (GMT+1)", value: "Europe/Madrid" },
];

export function Step2SyncSchedule({ onComplete, onBack }: Props) {
  const { getToken } = useAuth();
  const [selected, setSelected] = useState("0 2 * * *");
  const [customCron, setCustomCron] = useState("");
  const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const cron = selected === "custom" ? customCron : selected;
    try {
      const token = (await getToken()) || undefined;
      await api.patch("/tenants/current", { sync_schedule: cron, timezone }, token);
    } catch (err) {
      console.error("Failed to save schedule (continuing anyway):", err);
    } finally {
      setLoading(false);
      onComplete({ syncSchedule: cron, timezone });
    }
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-4">
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Paso 2 de 4</span>
        </div>
        <h2 className="text-3xl font-black text-white leading-tight">
          Horario de sincronización
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-lg">
          Elige cuándo se sincroniza el contenido de audio a tus dispositivos. Normalmente en horario de baja actividad.
        </p>
      </div>

      {/* Schedule Presets */}
      <div className="space-y-2">
        {SCHEDULE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setSelected(preset.value)}
            className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
              selected === preset.value
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-slate-900 bg-[#09090b] hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-3">
              {selected === preset.value ? (
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full border border-slate-700 flex-shrink-0" />
              )}
              <div>
                <span className={`text-sm font-semibold ${selected === preset.value ? "text-white" : "text-slate-300"}`}>
                  {preset.label}
                </span>
                {preset.recommended && (
                  <span className="ml-2 text-[9px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    Recomendado
                  </span>
                )}
                <p className="text-xs text-slate-500 mt-0.5">{preset.description}</p>
              </div>
            </div>
            {preset.value !== "custom" && (
              <span className="text-[10px] font-mono text-slate-600 ml-2 flex-shrink-0">{preset.value}</span>
            )}
          </button>
        ))}
      </div>

      {/* Custom Cron Input */}
      {selected === "custom" && (
        <div>
          <label htmlFor="cron" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Expresión cron personalizada
          </label>
          <input
            id="cron"
            type="text"
            value={customCron}
            onChange={(e) => setCustomCron(e.target.value)}
            className="w-full bg-[#09090b] border border-slate-800 rounded-xl py-2.5 px-4 font-mono text-sm text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
            placeholder="0 2 * * *"
          />
          <p className="mt-1.5 text-[10px] text-slate-600">
            Formato: minuto hora día-mes mes día-semana. Ej: <code className="text-slate-500">0 2 * * 1-5</code> = L-V a las 2 AM
          </p>
        </div>
      )}

      {/* Timezone */}
      <div>
        <label htmlFor="tz" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Zona horaria de referencia
        </label>
        <select
          id="tz"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full bg-[#09090b] border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all appearance-none"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || (selected === "custom" && !customCron.trim())}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 shadow-md hover:shadow-amber-500/20 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
