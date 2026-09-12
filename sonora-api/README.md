# Sonora API

Express.js 5 + TypeScript backend for the Sonora music discovery platform.

## Running

```sh
pnpm --filter @sonora/api dev     # tsx watch, port 3000 (or PORT)
pnpm --filter @sonora/api test    # Vitest + supertest integration tests
pnpm --filter @sonora/api lint
pnpm --filter @sonora/api typecheck
```

Copy `.env.example` to `.env` and fill in credentials before starting. Environment
is validated on startup by `src/lib/env.ts` (Zod) — missing vars fail fast with a
clear message.

## Conventions

- Responses are `{ data: ... }` (or `{ success: true }` for no-content writes).
- Errors are `{ error: "message" }` with proper status codes (400/401/404/409/429/500).
- Auth uses an httpOnly cookie named `token` (set by register/login). Protected
  endpoints require that cookie.
- Rate limits: global 300 req/15min per IP, `/api/auth` 20/15min, `/api/recommendation` 30/15min.
- All routes are prefixed with `/api`.

## Endpoints

### Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Liveness check |
| GET | `/api/health/db` | — | DB check (`select 1`), 503 if DB down |

### Music

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/music/search?q=<query>` | — | Search tracks (last.fm + iTunes art/preview) |
| GET | `/api/music/:artist/:track` | — | Track detail |
| GET | `/api/music/:artist/:track/similar` | — | Similar tracks |

`music` item shape: `{ title, artist, url, playCount?, imageUrl?, previewUrl? }`

### Artists

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/artists/search?q=<query>` | — | Search artists |
| GET | `/api/artists/:artist` | — | Artist detail |
| GET | `/api/artists/:artist/tracks` | — | Artist top tracks |
| GET | `/api/artists/:artist/similar` | — | Similar artists |

`artist` item shape: `{ name, url, imageUrl?, listeners?, playcount?, mbid? }`

### Discovery

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/discovery/popular-tracks` | — | Chart top tracks (with previewUrl) |
| GET | `/api/discovery/popular-artists` | — | Chart top artists |

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | — | Body `{ email, password, displayName }` → sets cookie |
| POST | `/api/auth/login` | — | Body `{ email, password }` → sets cookie |
| POST | `/api/auth/logout` | — | Clears cookie |
| GET | `/api/auth/me` | ✅ | Current user |

Emails are normalized to lowercase; password 8–128 chars; displayName ≤ 50 chars.

### Library

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/library/favorites` | ✅ | List favorites |
| POST | `/api/library/favorites` | ✅ | Add favorite `{ kind, name, artistName?, imageUrl?, url?, mbid? }` |
| DELETE | `/api/library/favorites/:id` | ✅ | Remove favorite |
| GET | `/api/library/playlists` | ✅ | List playlists (includes `isPublic`) |
| POST | `/api/library/playlists` | ✅ | Create playlist `{ name, description? }` |
| GET | `/api/library/playlists/:id` | ✅ | Playlist detail with tracks |
| PATCH | `/api/library/playlists/:id` | ✅ | Update `{ name?, description? }` |
| DELETE | `/api/library/playlists/:id` | ✅ | Delete playlist |
| POST | `/api/library/playlists/:id/tracks` | ✅ | Add track `{ name, artistName, ... }` |
| DELETE | `/api/library/playlists/:id/tracks/:trackId` | ✅ | Remove track |
| POST | `/api/library/playlists/:id/share` | ✅ | Make public, returns `{ token, url, isPublic }` |
| POST | `/api/library/playlists/:id/unshare` | ✅ | Make private, kills link |
| GET | `/api/library/history` | ✅ | Listening history |
| POST | `/api/library/history` | ✅ | Log an item (upsert by key) |
| GET | `/api/playlists/shared/:token` | — | Public read-only shared playlist |

### Recommendation

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/recommendation/for-you` | ✅ | Personalized picks. `source`: `ai` / `lastfm` / `empty` |
| GET | `/api/recommendation/similar-to/:artist` | — | Similar artists (last.fm only) |
| POST | `/api/recommendation/mood` | ✅ | Body `{ mood }` → mood-based track playlist. `source`: `ai` / `lastfm` |

For-you and mood results are cached per user (24h TTL) and fall back to last.fm
results when the Gemini call fails or is rate-limited.

### Genre

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/genre/:tag/tracks` | — | Genre top tracks |
| GET | `/api/genre/:tag/artists` | — | Genre top artists |

Known tags: `rock`, `pop`, `jazz`, `lo-fi`, `hip-hop`, `indie`, `electronic`, `city pop`.

### Follow & notifications

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/follows` | ✅ | Followed artists |
| POST | `/api/follows` | ✅ | Follow artist |
| DELETE | `/api/follows/:id` | ✅ | Unfollow |
| GET | `/api/notifications` | ✅ | Notifications (new releases of followed artists) |
| POST | `/api/notifications/read-all` | ✅ | Mark all read |
| POST | `/api/notifications/:id/read` | ✅ | Mark one read |

New-release checking runs every 6h (deduped per user + release).

### Stats

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/stats/me` | ✅ | `{ totalFavorites, totalListens, listensThisMonth, topArtists, topTracks }` |