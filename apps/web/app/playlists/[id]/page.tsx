"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Track {
  id: string;
  name: string;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
}

interface PlaylistDetail {
  id: string;
  name: string;
  description: string | null;
  rules: Record<string, unknown>;
  is_active: boolean;
  tracks: { audio_catalog: Track }[];
}

export default function PlaylistDetailPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [genreFilter, setGenreFilter] = useState("");
  const [moodFilter, setMoodFilter] = useState("");

  useEffect(() => { loadPlaylist(); }, []);

  async function loadPlaylist() {
    const token = (await getToken()) || undefined;
    const data = await api.get(`/playlists/${params.id}`, token);
    setPlaylist(data);
    setGenreFilter((data.rules as { genre_filter?: string })?.genre_filter || "");
    setMoodFilter((data.rules as { mood_filter?: string })?.mood_filter || "");
    setLoading(false);
  }

  async function updateRules() {
    const token = (await getToken()) || undefined;
    const rules: Record<string, unknown> = {};
    if (genreFilter) rules.genre_filter = genreFilter;
    if (moodFilter) rules.mood_filter = moodFilter;
    await api.put(`/playlists/${params.id}`, { rules }, token);
    loadPlaylist();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-destructive">Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <button onClick={() => router.push("/playlists")} className="mb-4 text-sm text-muted-foreground hover:text-foreground">← Playlists</button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">{playlist.name}</h1>
          {playlist.description && <p className="mt-1 text-sm text-muted-foreground">{playlist.description}</p>}
        </div>

        <Card className="mb-6 p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">SmartDJ Rules</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Genre filter</label>
              <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}
                className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">All genres</option>
                {["pop","rock","jazz","classical","electronic","hiphop","latin","ambient"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Mood filter</label>
              <select value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)}
                className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">All moods</option>
                {["energetic","calm","happy","melancholic","festive","neutral"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <Button size="sm" className="mt-3" onClick={updateRules}>Save Rules</Button>
        </Card>

        <h2 className="mb-3 text-lg font-semibold text-foreground">Tracks ({playlist.tracks.length})</h2>

        {playlist.tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tracks in this playlist. Add tracks from the Audio Library.</p>
        ) : (
          <div className="space-y-2">
            {playlist.tracks.map(({ audio_catalog: track }) => (
              <div key={track.id} className="flex items-center justify-between rounded-md bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{track.name}</p>
                  <div className="flex gap-2 mt-1">
                    {track.genre && <span className="text-xs text-muted-foreground">{track.genre}</span>}
                    {track.mood && <span className="text-xs text-muted-foreground">{track.mood}</span>}
                    {track.bpm && <span className="text-xs text-muted-foreground">{track.bpm} BPM</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
