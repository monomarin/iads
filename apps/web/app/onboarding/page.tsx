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

export default function OnboardingPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    loadProgress();
  }, [isSignedIn]);

  async function loadProgress() {
    const token = (await getToken()) || undefined;
    try {
      const data = await api.get("/onboarding/progress", token);
      setProgress(data);
      if (data.completed) {
        router.push("/");
      }
    } catch {
      setProgress({ step: 1, completed: false, data: {} });
    }
    setLoading(false);
  }

  async function updateProgress(step: number, data: Record<string, unknown>) {
    const token = (await getToken()) || undefined;
    const updated = await api.put("/onboarding/progress", { step, data }, token);
    setProgress(updated);
  }

  async function completeOnboarding() {
    const token = (await getToken()) || undefined;
    await api.post("/onboarding/complete", {}, token);
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentStep = progress?.step || 1;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Welcome to Retail Audio Engine</h1>
          <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8">
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex h-2 flex-1 rounded-full transition-colors ${
                s <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

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
