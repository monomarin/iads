"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface AudioTrack {
  id: string;
  name: string;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  duration_seconds: number | null;
  created_at: string;
}

const GENRES = ["", "pop", "rock", "jazz", "classical", "electronic", "hiphop", "latin", "ambient"];
const MOODS = ["", "energetic", "calm", "happy", "melancholic", "festive", "neutral"];

export default function AudioLibraryPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [genreFilter, setGenreFilter] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadTracks();
  }, [isSignedIn, genreFilter, moodFilter]);

  async function loadTracks() {
    const token = (await getToken()) || undefined;
    const params = new URLSearchParams();
    if (genreFilter) params.set("genre", genreFilter);
    if (moodFilter) params.set("mood", moodFilter);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await api.get(`/audio${query}`, token);
    setTracks(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Audio Library</h1>
          <Button onClick={() => router.push("/audio/new")}>Upload Audio</Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground">
            <option value="">All genres</option>
            {GENRES.filter(Boolean).map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground">
            <option value="">All moods</option>
            {MOODS.filter(Boolean).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="mx-auto mt-20 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : tracks.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">No audio files yet</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/audio/new")}>
              Upload your first track
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tracks.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-medium text-foreground truncate flex-1">{t.name}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {t.genre && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{t.genre}</span>}
                  {t.mood && <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">{t.mood}</span>}
                  {t.bpm && <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">{t.bpm} BPM</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.duration_seconds ? `${Math.floor(t.duration_seconds / 60)}:${(t.duration_seconds % 60).toString().padStart(2, "0")}` : "Unknown duration"}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
