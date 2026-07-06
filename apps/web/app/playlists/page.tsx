"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@raemonorepo/ui";
import { api } from "@/lib/api";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  rules: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export default function PlaylistsPage() {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [playlistList, setPlaylistList] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isSignedIn) { router.push("/sign-in"); return; }
    loadPlaylists();
  }, [isSignedIn]);

  async function loadPlaylists() {
    const token = (await getToken()) || undefined;
    const data = await api.get("/playlists", token);
    setPlaylistList(data);
    setLoading(false);
  }

  async function createPlaylist() {
    if (!name.trim()) return;
    const token = (await getToken()) || undefined;
    await api.post("/playlists", { name, description }, token);
    setShowCreate(false);
    setName("");
    setDescription("");
    loadPlaylists();
  }

  async function toggleActive(pl: Playlist) {
    const token = (await getToken()) || undefined;
    await api.put(`/playlists/${pl.id}`, { is_active: !pl.is_active }, token);
    loadPlaylists();
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Playlists</h1>
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : "New Playlist"}
          </Button>
        </div>

        {showCreate && (
          <Card className="mb-6 p-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="mb-3 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Playlist name" autoFocus />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="mb-3 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Description (optional)" />
            <Button onClick={createPlaylist} disabled={!name.trim()}>Create</Button>
          </Card>
        )}

        {loading ? (
          <div className="mx-auto mt-20 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : playlistList.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-muted-foreground">No playlists yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {playlistList.map((pl) => (
              <Card key={pl.id} className="flex cursor-pointer items-center justify-between p-4 transition-all hover:border-primary/50"
                onClick={() => router.push(`/playlists/${pl.id}`)}>
                <div>
                  <h3 className="font-medium text-foreground">{pl.name}</h3>
                  {pl.description && <p className="text-sm text-muted-foreground">{pl.description}</p>}
                  {(pl.rules as { genre_filter?: string })?.genre_filter && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Genre: {(pl.rules as { genre_filter?: string }).genre_filter}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${pl.is_active ? "bg-success" : "bg-muted"}`} />
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); toggleActive(pl); }}>
                    {pl.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
