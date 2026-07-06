"use client";

import { Button } from "@raemonorepo/ui";
import { useState } from "react";

interface Props {
  onComplete: () => void;
}

const TOUR_STEPS = [
  {
    title: "Dashboard",
    description: "View real-time metrics for your store: active campaigns, audio plays, and engagement.",
  },
  {
    title: "Campaigns",
    description: "Create and manage audio advertising campaigns. Up to 5 A/B test variants per campaign.",
  },
  {
    title: "Audio Library",
    description: "Browse and manage your audio files. Upload new tracks, organize by mood and genre.",
  },
  {
    title: "Soul Editor",
    description: "Configure your store's audio identity — select moods, genres, and playback rules.",
  },
  {
    title: "Schedule",
    description: "Set when audio plays throughout the day. Override the global sync schedule per store.",
  },
  {
    title: "Reports",
    description: "Access performance reports: CEO, Technical, Store Admin, and Advertiser views.",
  },
];

export function Step4Tour({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = TOUR_STEPS[currentStep]!;

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Quick tour</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what you&apos;ll find in your dashboard.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-2 text-xs font-medium text-primary">
          Step {currentStep + 1} of {TOUR_STEPS.length}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
        <p className="text-sm text-muted-foreground">{step.description}</p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={prev}>
                Prev
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {currentStep < TOUR_STEPS.length - 1 ? "Next" : "Finish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button variant="link" onClick={onComplete} className="text-sm">
          Skip tour
        </Button>
      </div>
    </div>
  );
}
