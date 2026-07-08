"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Step1CreateStore } from "./step1-create-store";
import { Step2SyncSchedule } from "./step2-sync-schedule";
import { Step3UploadMusic } from "./step3-upload-music";
import { Step4Tour } from "./step4-tour";

interface OnboardingData {
  step: number;
  completed: boolean;
  data: Record<string, unknown>;
}

const STEP_LABELS = [
  "Crear tienda",
  "Horario de sync",
  "Subir música",
  "¡Listo!",
];

export default function OnboardingPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    loadProgress();
  }, [isLoaded, isSignedIn]);

  async function loadProgress() {
    setLoading(true);
    try {
      const token = (await getToken()) || undefined;
      const data = await api.get("/onboarding/progress", token);
      setProgress(data);
      if (data.completed) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Failed to load onboarding progress:", err);
      // Start fresh if progress can't be loaded
      setProgress({ step: 1, completed: false, data: {} });
    } finally {
      setLoading(false);
    }
  }

  async function updateProgress(step: number, data: Record<string, unknown>) {
    setSaving(true);
    try {
      const token = (await getToken()) || undefined;
      const updated = await api.put("/onboarding/progress", {
        step,
        data: { ...(progress?.data || {}), ...data },
      }, token);
      setProgress(updated);
    } catch (err) {
      console.error("Failed to save progress:", err);
      // Advance locally even if API fails so user isn't stuck
      setProgress((prev) => ({
        step,
        completed: false,
        data: { ...(prev?.data || {}), ...data },
      }));
    } finally {
      setSaving(false);
    }
  }

  async function completeOnboarding() {
    setSaving(true);
    try {
      const token = (await getToken()) || undefined;
      await api.post("/onboarding/complete", {}, token);
    } catch (err) {
      console.error("Failed to mark onboarding complete:", err);
    } finally {
      setSaving(false);
      router.push("/dashboard");
    }
  }

  const currentStep = progress?.step || 1;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-xs text-slate-500">Cargando onboarding...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Header */}
      <header className="border-b border-slate-900 px-6 py-4 bg-[#050507]">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18V5l12-2v13" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6" cy="18" r="3" stroke="#EAB308" strokeWidth="2"/>
                <circle cx="18" cy="16" r="3" stroke="#EAB308" strokeWidth="2"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-white">Retail Audio Engine</span>
          </div>
          <span className="text-xs text-slate-500">
            Paso {Math.min(currentStep, 4)} de 4
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-slate-900 bg-[#050507]">
        <div className="mx-auto max-w-3xl px-6 py-4">
          {/* Step Labels */}
          <div className="flex mb-3">
            {STEP_LABELS.map((label, i) => {
              const stepNum = i + 1;
              const isActive = stepNum === currentStep;
              const isDone = stepNum < currentStep;
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                    isDone
                      ? "bg-amber-500 border-amber-500 text-black"
                      : isActive
                      ? "border-amber-500 text-amber-500 bg-amber-500/10"
                      : "border-slate-800 text-slate-600"
                  }`}>
                    {isDone ? "✓" : stepNum}
                  </div>
                  <span className={`text-[9px] font-medium hidden sm:block ${
                    isActive ? "text-amber-400" : isDone ? "text-slate-400" : "text-slate-700"
                  }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress Track */}
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex h-1 flex-1 rounded-full transition-all duration-500 ${
                  s < currentStep
                    ? "bg-amber-500"
                    : s === currentStep
                    ? "bg-amber-500/50"
                    : "bg-slate-900"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
        {saving && (
          <div className="mb-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
            <span className="h-3 w-3 rounded-full border border-amber-500 border-t-transparent animate-spin" />
            Guardando progreso...
          </div>
        )}

        <div className="flex-1">
          {currentStep === 1 && (
            <Step1CreateStore
              onComplete={(data) => updateProgress(2, data)}
            />
          )}
          {currentStep === 2 && (
            <Step2SyncSchedule
              onComplete={(data) => updateProgress(3, data)}
              onBack={() => updateProgress(1, progress?.data || {})}
            />
          )}
          {currentStep === 3 && (
            <Step3UploadMusic
              onComplete={(data) => updateProgress(4, data)}
              onBack={() => updateProgress(2, progress?.data || {})}
            />
          )}
          {currentStep === 4 && (
            <Step4Tour onComplete={completeOnboarding} />
          )}
        </div>
      </div>
    </div>
  );
}
