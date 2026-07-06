"use client";

import { Button } from "@raemonorepo/ui";
import { useState, useRef } from "react";

interface Props {
  onComplete: (data: Record<string, unknown>) => void;
  onBack: () => void;
}

export function Step3UploadMusic({ onComplete, onBack }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setUploading(true);
    // Simulate upload delay — R2 upload happens via API
    await new Promise((r) => setTimeout(r, 1500));
    onComplete({ uploadedCount: files.length });
    setUploading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Upload your music</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload initial audio files for your store. You can add more later.
        </p>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50"
      >
        <svg
          className="mb-3 h-10 w-10 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19V6l-2.5 2.5M15 19V6l2.5 2.5M12 3v12"
          />
        </svg>
        <p className="text-sm text-muted-foreground">
          Click to select MP3 files
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.ogg"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-label="Select audio files"
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-md bg-card px-3 py-2"
            >
              <span className="truncate text-sm text-foreground">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-2 text-sm text-destructive hover:text-destructive/80"
                aria-label={`Remove ${file.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || uploading}
          className="flex-1"
        >
          {uploading ? "Uploading..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
