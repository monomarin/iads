"use client";

import { useState } from "react";
import { 
  LayoutDashboard, Megaphone, Music, Settings2, FileBarChart, 
  Radio, Rocket, ArrowRight, ArrowLeft, CheckCircle2
} from "lucide-react";

interface Props {
  onComplete: () => void;
}

const TOUR_STEPS = [
  {
    icon: LayoutDashboard,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    title: "Panel de Control",
    description: "Ve métricas en tiempo real de tu red: tiendas activas, reproductores online, plays de audio e ingresos estimados. Tu centro de operaciones.",
  },
  {
    icon: Megaphone,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    title: "Campañas",
    description: "Crea y gestiona campañas de audio publicitario. Configura hasta 5 variantes A/B por campaña, horarios y zonas de tienda.",
  },
  {
    icon: Music,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    title: "Biblioteca de Audio",
    description: "Administra todos tus archivos de audio. Sube tracks, organiza por estado de ánimo y género, crea playlists inteligentes.",
  },
  {
    icon: Radio,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    title: "Edge Nodes",
    description: "Monitorea los reproductores físicos en cada tienda. Ve estado online/offline, última sincronización y versión de firmware.",
  },
  {
    icon: FileBarChart,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    title: "Reportes",
    description: "Accede a reportes de rendimiento: CEO ejecutivo, técnico, administrador de tienda y vista de anunciante. Exporta en PDF o CSV.",
  },
  {
    icon: Settings2,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    title: "Configuración",
    description: "Gestiona tu perfil, usuarios del equipo, integraciones y parámetros generales de la plataforma.",
  },
];

export function Step4Tour({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = TOUR_STEPS[currentStep]!;
  const Icon = step.icon;

  function next() {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  }

  function prev() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
          <Rocket className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Paso 4 de 4 · Tour rápido</span>
        </div>
        <h2 className="text-3xl font-black text-white leading-tight">
          ¡Casi listo! Conoce tu panel
        </h2>
        <p className="mt-2 text-sm text-slate-400 max-w-lg">
          Un recorrido rápido por las principales secciones de Retail Audio Engine.
        </p>
      </div>

      {/* Feature Dot Navigation */}
      <div className="grid grid-cols-6 gap-2">
        {TOUR_STEPS.map((ts, i) => {
          const TIcon = ts.icon;
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 ${
                isActive
                  ? `${ts.border} ${ts.bg}`
                  : isDone
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-slate-900 bg-[#09090b] hover:border-slate-800"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <TIcon className={`h-5 w-5 ${isActive ? ts.color : "text-slate-600"}`} />
              )}
              <span className={`text-[9px] font-bold text-center leading-tight hidden sm:block ${
                isActive ? "text-white" : isDone ? "text-emerald-500" : "text-slate-700"
              }`}>
                {ts.title.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Step Card */}
      <div className={`rounded-2xl border ${step.border} ${step.bg} p-6 transition-all duration-300`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${step.border} bg-black/40`}>
            <Icon className={`h-6 w-6 ${step.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-black text-white">{step.title}</h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentStep + 1}/{TOUR_STEPS.length}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-6">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`rounded-full transition-all duration-200 ${
                i === currentStep
                  ? "w-5 h-1.5 bg-amber-500"
                  : i < currentStep
                  ? "w-1.5 h-1.5 bg-emerald-500"
                  : "w-1.5 h-1.5 bg-slate-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={prev}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="px-5 py-3 rounded-xl font-semibold text-sm text-slate-600 hover:text-slate-400 transition-all"
          >
            Omitir
          </button>
        )}

        <button
          onClick={next}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 shadow-md hover:shadow-amber-500/20 hover:shadow-lg transition-all duration-200"
        >
          {currentStep < TOUR_STEPS.length - 1 ? (
            <>
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              ¡Ir al dashboard!
            </>
          )}
        </button>
      </div>
    </div>
  );
}
