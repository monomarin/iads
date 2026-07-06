# SPEC-03: Audio Pipeline + SmartDJ

**Status**: Draft | **Priority**: High | **Dependencies**: SPEC-00, SPEC-01

## 1. Descripción

Pipeline de audio: subida manual de MP3 a Cloudflare R2, catálogo categorizado por género/mood/BPM,
y SmartDJ que selecciona la música ideal según el perfil Soul.md + hora del día + afluencia.

## 2. Stack

| Capa | Tecnología |
|------|-----------|
| Storage | Cloudflare R2 (S3-compatible) |
| Backend | Fastify + multipart upload |
| Frontend | Next.js drag & drop upload |
| Metadata | Drizzle ORM (audio_catalog, playlists) |

## 3. Database Schema

```sql
CREATE TABLE audio_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  file_key TEXT NOT NULL UNIQUE,          -- R2 object key
  duration_seconds INTEGER,
  genre TEXT,                              -- pop, rock, jazz, classical, electronic, hiphop, latin, ambient
  mood TEXT,                               -- energetic, calm, happy, melancholic, festive, neutral
  bpm INTEGER,
  is_uploaded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB DEFAULT '{}',               -- SmartDJ rules: {genre_filter, mood_filter, bpm_range}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlist_tracks (
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES audio_catalog(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (playlist_id, track_id)
);
```

## 4. API Endpoints

| Method | Path | Descripción |
|--------|------|-------------|
| GET | `/api/audio` | List audio catalog (filter by genre/mood) |
| POST | `/api/audio/upload` | Upload MP3 to R2 + create catalog entry |
| GET | `/api/audio/:id` | Get audio details + signed URL |
| DELETE | `/api/audio/:id` | Delete from R2 + catalog |
| GET | `/api/playlists` | List playlists |
| POST | `/api/playlists` | Create playlist with SmartDJ rules |
| PUT | `/api/playlists/:id` | Update playlist rules |
| POST | `/api/playlists/:id/tracks` | Add track to playlist |
| DELETE | `/api/playlists/:id/tracks/:tid` | Remove track |
| GET | `/api/smartdj/next` | Get next track based on rules + context |
| POST | `/api/smartdj/regenerate` | Regenerate playlist from rules |

## 5. SmartDJ Logic

```
Input: time_of_day, day_of_week, store_affluence, soul_profile
Output: next_track from active playlist

Time mappings:
  morning (6-12):   calm, neutral, happy
  afternoon (12-18): energetic, happy, pop
  evening (18-22):  festive, latin, electronic
  night (22-6):     ambient, calm, jazz

Affluence mapping:
  low:  calm, ambient, jazz
  medium: happy, pop, neutral
  high: energetic, festive, latin
```

## 6. Frontend Routes

| Route | Descripción |
|-------|-------------|
| `/audio` | Audio library with grid/list view |
| `/audio/upload` | Drag & drop upload form |
| `/playlists` | Playlist management |
| `/playlists/:id` | Playlist detail + track ordering |
| `/settings/soul` | Soul.md profile editor |

## 7. Acceptance Criteria

- [ ] Upload MP3 to R2 via multipart form
- [ ] Catalog view with genre/mood filters
- [ ] Playlist creation with SmartDJ rules
- [ ] SmartDJ returns appropriate track for time + context
- [ ] Audio player preview in browser
- [ ] Signed URL generation for secure playback
