"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Button } from "@raemonorepo/ui";

const GENRES = ["pop", "rock", "jazz", "classical", "electronic", "hiphop", "latin", "ambient"];
const MOODS = ["energetic", "calm", "happy", "melancholic", "festive", "neutral"];

export default function UploadAudioPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [bpm, setBpm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please select a file"); return; }
    setUploading(true);
    setError("");

    try {
      const token = (await getToken()) || undefined;
      const formData = new FormData();
      formData.append("file", file);
      if (genre) formData.append("genre", genre);
      if (mood) formData.append("mood", mood);
      if (bpm) formData.append("bpm", bpm);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      await fetch(`${API_URL}/api/audio/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      router.push("/audio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => router.back()} className="mb-4 text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Upload Audio</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0] || null); }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
          >
            <svg className="mb-3 h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l-2.5 2.5M15 19V6l2.5 2.5M12 3v12" />
            </svg>
            <p className="text-sm text-muted-foreground">
              {file ? file.name : "Drop MP3 file here or click to browse"}
            </p>
            <input ref={inputRef} type="file" accept=".mp3,.wav,.ogg" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" aria-label="Select audio file" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Genre</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select...</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Mood</label>
              <select value={mood} onChange={(e) => setMood(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">Select...</option>
                {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">BPM</label>
              <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="120" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}

          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={() => router.back()} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={!file || uploading} className="flex-1">
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
