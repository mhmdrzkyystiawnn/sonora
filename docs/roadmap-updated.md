# Sonora — Roadmap (Updated)

## ✅ Session update — Artist Frontend & Theme Alignment

### Pencapaian
- **Milestone 4 (Artist Frontend)** telah selesai dikerjakan:
  - `ArtistSearchResult` schema diexport dari `@sonora/shared`.
  - API client `apps/web/src/api/artist.ts` diimplementasikan dengan error handling.
  - Halaman `ArtistSearch.tsx` (Grid view) dan `ArtistDetail.tsx` (Hero layout, bio, top tracks) telah dibuat.
  - Routing dikonfigurasi di `App.tsx`.
  - Navigation diletakkan di `Navbar.tsx`.
- **Theme Alignment**:
  - Semua komponen frontend telah disesuaikan agar full menggunakan design system baru di `index.css`.
  - Class typography `.font-display` dan `.font-script` diaplikasikan ke seluruh halaman.
  - `<title>` di `index.html` diperbarui menjadi "Sonora".

---

## Status update

- Artist module: ✅ selesai
  - Search, detail, dan top tracks sudah tervalidasi dan diuji manual.
  - Hasil yang valid mengembalikan `200`, sedangkan artist yang tidak ditemukan mengembalikan `404`.

- API routing: ✅ selesai
  - Handler 404, global error handler, dan format response sudah konsisten.

- Milestone 3 — Artist API: ✅ selesai

---

## Current status

| Area | Status |
|---|---:|
| Foundation | 100% |
| Music API | 100% |
| Artist API | 100% |
| Music Frontend | 100% |
| Artist Frontend | 100% |
| Discovery | 100% |
| Auth + DB | 100% |
| Library | 100% |

---

## ✅ Milestone 4: Artist Frontend (Selesai)

Semua tugas pada milestone ini telah diselesaikan, termasuk API client, routing, search UI, dan artist detail page lengkap dengan top tracks.

---

## ✅ Milestone 5: Discovery Page (Selesai)

Halaman awal berisi konten tanpa perlu search dulu (app ga berasa kosong pas pertama dibuka).

### 5.1 Backend — discovery module (baru)
- [x] `modules/discovery/discovery.controller.ts` + `.service.ts` + `.routes.ts`
- [x] `GET /api/discovery/popular-tracks` — pakai `chart.getTopTracks` last.fm
- [x] `GET /api/discovery/popular-artists` — pakai `chart.getTopArtists`
- [x] `GET /api/artists/:artist/similar` — pakai `artist.getSimilar` (taruh di artist module, bukan discovery, karena scoped ke 1 artist)
- [x] `GET /api/music/:artist/:track/similar` — pakai `track.getSimilar`
- [x] Reuse `ApiError`/`NotFoundError` pattern yang udah ada
- [x] Reuse itunes fallback buat image

### 5.2 Frontend — discovery page
- [x] Route `/` (homepage) isinya discovery, bukan blank/redirect ke search
- [x] Section "Popular Tracks" (horizontal scroll atau grid, pakai `Card`)
- [x] Section "Popular Artists"
- [x] Section "Similar Artists" muncul di artist detail page (bukan discovery page)
- [x] Loading skeleton per section (jangan block whole page nunggu semua section)

**Selesai kalau:** buka `/` langsung ada konten menarik, ga perlu search dulu.

---

## ✅ Milestone 6 — Auth + Database (Selesai)

Ini titik krusial — pertama kalinya sonora butuh **state yang persisten** (bukan cuma proxy ke last.fm). Butuh keputusan teknis dulu sebelum ngoding.

### 6.1 Keputusan teknis (ambil sebelum mulai coding)
- [x] Pilih DB: **PostgreSQL** direkomendasikan (relational, cocok buat users/favorites/playlists yang saling terkait)
- [x] Pilih ORM: **Drizzle** (ringan, type-safe, cocok sama stack TS-heavy kamu) atau **Prisma**
- [x] Pilih auth strategy: **session-based (cookie)** atau **JWT**? → untuk monorepo dengan FE/BE terpisah domain saat production, JWT di httpOnly cookie biasanya lebih gampang dihandle CORS-nya
- [x] Hosting DB: Neon / Supabase / Railway (semua ada free tier, cocok buat tahap ini)

### 6.2 Database schema (dari roadmap awal kamu)
```
users
  ├── profiles
  ├── favorites
  ├── playlists
  │      └── playlist_tracks
  └── search_history
```
- [ ] Tambahin tabel baru buat AI nanti (lihat Milestone 7): `user_taste_vectors` atau `listening_signals` (belum dibuat — nyusul di Milestone 7)

### 6.3 Backend — auth module
- [x] `modules/auth/` — register, login, logout, session/token refresh
- [x] Password hashing (`argon2` atau `bcrypt`)
- [x] Middleware `requireAuth` buat protect route favorites/playlists nanti
- [x] Validasi pakai zod (`registerSchema`, `loginSchema` di `@sonora/shared`)

### 6.4 Frontend — auth UI
- [x] Login page, register page
- [x] Auth state management (context/store — Zustand ringan & cocok skala project ini)
- [x] Protected route wrapper
- [x] Avatar/profile dropdown di navbar

**Selesai kalau:** user bisa register, login, logout, dan session persist setelah refresh.

---

## Milestone 7 — Library + AI Recommendation (updated: pakai Gemini, bukan Claude)

### 7.1 Library features (backend + frontend) — tetap sama

- [x] `POST /api/library/favorites` — add favorite track/artist
- [x] `DELETE /api/library/favorites/:id`
- [x] `GET /api/library/favorites`
- [x] `POST /api/library/playlists` + `playlist_tracks` CRUD
- [x] `GET /api/library/history` — auto-log setiap kali user buka detail track/artist
- [x] Frontend: halaman "My Library" — tabs Favorites / Playlists / History
- [x] Tombol "favorite" reusable di artist card, track card

> **Selesai (bagian Library):** 32 e2e test PASS — CRUD favorites/playlists/tracks + history dedupe (upsert), ownership antar user (404), semua route di bawah `requireAuth`. Frontend: halaman `/library` (tabs Favorites/Playlists/History), tombol favorite di detail track/artist + hasil search music, history auto-log saat buka detail track/artist.

### 7.2 AI Provider — Google Gemini API (free tier)

**Kenapa Gemini, bukan OpenRouter:**
- Gemini API punya free tier resmi langsung dari Google, model & rate limit jelas (bukan rotasi tiap minggu kayak model gratis OpenRouter)
- Ga perlu kartu kredit
- Model yang direkomendasikan: **Gemini 3.5 Flash** atau **Gemini 3.5 Flash-Lite** — cukup buat rerank + generate short text, ga butuh reasoning model mahal (Pro)

**Trade-off yang perlu diketahui:**
- Free tier Gemini strict soal rate limit (request per menit & per hari terbatas) — di production nanti, kalau user makin banyak, request AI **wajib di-cache** biar ga sering-sering hit API
- Prompt & response di free tier bisa dipakai Google buat improve produk mereka — kalau ada concern soal privasi data user, ini perlu didiskusikan sebelum production (bisa upgrade ke paid tier nanti buat matiin data sharing ini)
- Free tier bisa berubah kapan aja tanpa pemberitahuan — **desain kode dengan abstraction layer**, jangan hardcode langsung ke Gemini SDK di banyak tempat, biar gampang ganti provider kalau suatu saat perlu

### 7.3 Arsitektur AI recommendation (sama seperti sebelumnya, provider aja yang beda)

```
ambil kandidat dari artist.getSimilar / track.getSimilar (last.fm)
        │
        ▼
kirim kandidat + user taste profile (top artist dari history/favorites) ke Gemini
        │
        ▼
minta Gemini rerank & filter berdasarkan relevansi + generate "why recommended"
        │
        ▼
tampilkan hasil rerank
```

### 7.4 Implementasi AI
- [x] Backend: `modules/recommendation/` — service/controller/routes
- [x] Bikin **abstraction layer** `lib/ai-client.ts` — wrap pemanggilan Gemini di 1 tempat (raw fetch, ganti provider cukup ubah 1 file), lazy-read `GEMINI_API_KEY`
- [x] Function ambil user taste signal: top artists dari history/favorites (frequency-based)
- [x] Function ambil kandidat: loop `artist.getSimilar` buat tiap top artist user (dedupe, cap 20)
- [x] Integrasi Gemini API — rerank kandidat + generate short "why recommended" text (JSON mode + zod validate)
- [x] **Cache hasil recommendation** (tabel `recommendation_cache`, TTL 24 jam, di-invalidate tiap ada favorite baru)
- [x] Handle rate limit error (429) dengan graceful fallback — kalau Gemini error/limit, tampilkan hasil last.fm apa adanya (`source: "lastfm"`)
- [x] `GET /api/recommendation/for-you` (protected, butuh login)
- [x] `GET /api/recommendation/similar-to/:artist` (public, real-time, last.fm only tanpa AI)
- [ ] Paste `GEMINI_API_KEY` ke `apps/api/.env`, verifikasi path AI (rerank + reason + cache) di test manual

> **Selesai (bagian code):** 12 e2e test PASS — empty taste → `source: "empty"`, fallback tanpa key → `source: "lastfm"`, cache row tersimpan + invalidate saat favorite baru, similar-to 200/400, for-you 401 tanpa login. Build + lint web lulus. **Sisa:** verifikasi path AI beneran butuh `GEMINI_API_KEY` di `.env`.

> **Path AI terverifikasi:** `GEMINI_API_KEY` sudah di-paste, e2e AI path PASS — `source: "ai"` + 8 rekomendasi dengan reason non-empty, cache row tersimpan, uncached ~10s / cached ~180ms. **Catatan:** model default `gemini-2.5-flash` udah ga dipakai (deprecated untuk user baru, 404) → ganti ke **`gemini-3.5-flash-lite`** (mendukung JSON mode, cepat ~3s, ga butuh thinkingConfig). `gemini-3.5-flash` sering 503 "high demand" di free tier → ai-client punya retry (3x, backoff) untuk 429/503, dan kalau tetep gagal otomatis fallback ke last.fm. Override model via `GEMINI_MODEL` env.

### 7.5 Frontend — recommendation UI (sama seperti sebelumnya)
- [x] Section "Recommended for You" di discovery page (kalau logged in) — `source: "ai"` nampilin reason per card + badge "curated with AI"
- [x] Card recommendation dengan short explanation text dari AI
- [~] Section "Because you liked X" di artist detail page — **diputuskan skip**: halaman Artist Detail tetap pakai section "Similar Artists" yang sudah ada (ga ada regression), karena `similar-to/:artist` itu last.fm only tanpa personalisasi

**Selesai kalau:** user yang punya favorite/history dapat rekomendasi personal dengan alasan yang masuk akal, dan sistem tetap jalan (dengan fallback) walau lagi kena rate limit Gemini.

---

## Milestone 8 — Feature Expansion

> Diselipkan sebelum production hardening karena semuanya reuse infrastruktur yang udah ada (last.fm, iTunes, `ai-client.ts`, favorites/history) — low risk, dampaknya langsung kerasa di UX sebelum masuk ke testing/security/deployment. Milestone lama "Production Readiness" & "Deployment" jadi Milestone 9 & 10.

### 8.1 Audio preview (30 detik)
- [x] Cek response iTunes Search API — field `previewUrl` konsisten: search 30/30, popular tracks 10/10, detail & similar juga ada (backend di-merge ke `getITunesTrackData`, 1 call iTunes per track + in-memory cache 24h + concurrency limit 5 biar ga kena rate limit)
- [x] Komponen `AudioPreviewButton` (play/pause icon) reusable, taruh di track card (MusicSearch row, Discovery popular tracks) & track detail (MusicDetail header, ada label "Preview")
- [x] State: cuma 1 audio yang play dalam satu waktu — `AudioPlayerProvider` (context) pegang 1 elemen `<audio>`, klik preview lain otomatis pause yang lama
- [x] Handle case `previewUrl` kosong — tombol di-render `null` (ga muncul) kalau backend ga punya preview

**Selesai kalau:** user bisa preview 30 detik langsung dari card tanpa pindah halaman.

> **Selesai (8.1):** e2e 7 PASS — previewUrl konsisten di search/detail/popular/similar. Build + lint web lulus. `musicSchema` + `trackDetailSchema` (shared) sekarang punya `previewUrl` opsional.

### 8.2 Genre/mood browsing
- [x] Backend: `modules/genre/` — `GET /api/genre/:tag/tracks` (`tag.gettoptracks` → `tracks.track`, bukan `toptracks`), `GET /api/genre/:tag/artists` (`tag.gettopartists`), enrich iTunes (cover + previewUrl), track/artist di-validate pakai schema shared
- [x] List tag curated — `GENRES` di `packages/shared/src/lib/genres.ts` (rock, pop, jazz, lo-fi, hip-hop, indie, electronic, city pop), dipakai backend (validasi 404) & frontend (grid) sekaligus
- [x] Frontend: halaman `/genre` — grid chip per genre (8 kartu)
- [x] Frontend: halaman `/genre/:tag` — section Top Tracks (list + AudioPreviewButton + plays) & Top Artists (horizontal cards), skeleton per section
- [x] Tambah entry navigasi — navbar "Genres" + route di App.tsx

**Selesai kalau:** user bisa browse musik lewat genre tanpa perlu tau nama artist/track spesifik.

> **Selesai (8.2):** e2e 12 PASS — tracks/artists non-empty, previewUrl ada, genre URL-encoded (city pop) jalan, genre tak dikenal 404. Build + lint web lulus. Catatan: `tag.gettoptracks` last.fm punya struktur respons `tracks.track` (bukan `toptracks`).

### 8.3 Follow artist + notifikasi rilisan baru
- [x] Tabel baru `artist_follows` — keputusan: **tabel terpisah** (bukan reuse favorites), karena follow punya semantik berbeda (khusus artist, trigger notifikasi). Unique(user_id, key) biar ga double-follow
- [x] Scheduled job `lib/release-checker.ts` — `checkNewReleases()` tiap 6 jam (setInterval, nggak butuh dep baru): scan `artist_follows`, `artist.gettopalbums` (limit 1), kalau album rilis dalam 14 hari terakhir → bikin notifikasi per user, dedupe pakai unique(user_id, dedupe_key)
- [x] Tabel `notifications` (user_id, message, read bool, dedupe_key unique, created_at)
- [x] Frontend: badge notifikasi di navbar (`NotificationBell` — unread count badge, dropdown list, mark all read, mark single read)
- [x] Tombol "Follow" di artist detail page (`FollowButton` — bell icon, terpisah dari FavoriteButton; state via `FollowProvider` context) + tab "Following" di My Library

**Selesai kalau:** user dapat notifikasi in-app kalau artist yang di-follow rilis album baru.

> **Selesai (8.3):** e2e follow 12 PASS — 401/201/409/400/200/404 (ownership), list/read/read-all/delete. Smoke test release checker PASS — jalan tanpa error, run kedua tidak bikin duplikat (dedupe key jalan). Build + lint web lulus.

### 8.4 Export/share playlist
- [x] Backend: `GET /api/library/playlists/:id/share` — generate public read-only link (slug/token, bukan expose `user_id` asli)
- [x] Frontend: halaman publik `/playlist/shared/:token` — read-only view, ga perlu login
- [x] Export ke format teks/JSON (list track + artist) — user bisa copy buat manual import ke Spotify
- [x] Toggle "make playlist public" di halaman My Library

**Selesai kalau:** user bisa share link playlist yang bisa dibuka orang lain tanpa login.

> **Selesai (8.4):** e2e share 9 PASS — share → token+isPublic, list refleksikan isPublic, anonim bisa buka read-only link, invalid token 404, unshare matikan link publik. JSON export + copy-link (clipboard) di Library. Build + lint web lulus. `playlists` dapat kolom `is_public` + `share_token` (pushed).

### 8.5 Personal listening stats
- [x] Backend: `GET /api/stats/me` — agregasi dari `search_history` & `favorites` (top artist, top genre kalau genre tag udah ada di 8.2, total track di-favorite)
- [x] Frontend: halaman `/stats` — cards/chart sederhana (pakai `recharts` yang mungkin udah ada di stack, atau simple bar list dulu)
- [ ] Filter periode (all-time / bulan ini) — opsional, bisa all-time dulu buat versi awal

**Selesai kalau:** user bisa liat ringkasan kebiasaan dengar mereka sendiri di satu halaman.

> **Selesai (8.5):** e2e stats 15 PASS — 401 tanpa login, stats kosong user baru, total favorites/listens/bulan ini, topArtists berperingkat benar (Daft Punk 3, Black Sabbath 1), topTracks hanya favorit track. Halaman `/stats` + Navbar "Stats" (login-only). Catatan: top genre di-skip — favorites/history tidak menyimpan genre tag per item, jadi agregasi genre butuh N+1 lookup last.fm; topArtists (dari favorites) + topTracks dipakai sebagai gantinya. Build + lint web lulus.

### 8.6 Mood-based playlist generator (Gemini)
- [x] Frontend: input text bebas ("lagi galau", "buat nugas", "road trip vibes") di halaman baru atau section di discovery
- [x] Backend: `POST /api/recommendation/mood` — kirim mood + kandidat (last.fm top tracks per genre relevan / similar dari top artist user) ke Gemini
- [x] Reuse `lib/ai-client.ts` yang udah ada — cukup tambah prompt baru, jangan bikin abstraction baru
- [x] Reuse pattern cache & fallback yang udah ada di recommendation module (kalau Gemini limit/error → fallback ke hasil last.fm biasa tanpa mood-filtering)
- [x] Frontend: render hasil sebagai "playlist sementara" (bisa langsung di-save ke playlist beneran kalau login)

**Selesai kalau:** user ketik mood/aktivitas bebas, dapat daftar track/artist yang relevan, dan tetap jalan walau Gemini lagi rate-limited.

> **Selesai (8.6):** e2e mood 7 PASS — 401 tanpa login, mood kosong/whitespace 400, hasil source=ai (10 track, semua punya reason), cache hit ~127ms, fallback lastfm tersedia. Kandidat dari 5 genre (rock/jazz/hip-hop/electronic/lo-fi) + top 2 taste artist user. `ai-client.ts` di-refactor ke helper `callGemini` (satu klien, prompt kedua `selectMoodTracks`), `recommendationSchema` dapat `artistName` + `previewUrl` opsional. UI: section "Mood Mixes" di Discovery (input bebas, preview audio per track, tombol "Save as playlist" → bikin playlist "Mood: <mood>"). Build + lint web lulus.

---

## Milestone 9 — Production Readiness

### 9.1 Testing
- [x] Unit test service layer (music, artist, recommendation) — Vitest
- [x] Integration test API endpoints (supertest)
- [x] Frontend component test (React Testing Library) buat komponen kritis (search, favorite button)
- [ ] Manual E2E smoke test checklist sebelum tiap deploy

**Selesai kalau:** tiap workspace punya test runner yang bisa jalan di CI, dan endpoint inti + komponen kritis ditest.

> **Selesai (9.1):** API: Vitest + supertest (7 test PASS) — health, music search (lastfm+itunes di-stub via fetch mock), invalid query 400, artist search, discovery, auth register/login + favorites + rekomendasi for-you (Gemini di-stub → source=ai), 404 handler. `index.ts` di-refactor → `app.ts` (testable, tanpa listen/release-checker); CORS baca `CORS_ORIGIN`. Web: Vitest + RTL + jsdom (2 test PASS) — AudioPreviewButton null-tanpa-src & toggle play/pause. Root: script `pnpm test` + task `test` di turbo.json. Manual smoke checklist masih opsional.

### 9.2 Code quality
- [x] Lint semua workspace (`eslint` config konsisten di semua `apps/`)
- [x] Typecheck semua workspace di CI
- [x] Environment variable validation (zod schema buat `.env`, biar error jelas kalau ada var yang lupa di-set)

**Selesai kalau:** lint & typecheck jalan di semua workspace (lokal + CI), dan env config error-nya jelas.

> **Selesai (9.2):** ESLint flat config ditambahkan ke `@sonora/api` (dipakai TS 7 → diturunkan ke `typescript@~6.0.2` biar kompatibel typescript-eslint) dan `@sonora/shared`; web sudah punya. Lint api+shared bersih. CI GitHub Actions (`.github/workflows/ci.yml`): job `quality` (lint, check-types, web test, build, audit) + job `api-integration` (vitest, butuh secrets DB/JWT/last.fm/Gemini). Env validation baru `src/lib/env.ts` (zod, aggregated error, gagal cepat di startup), `app.ts`/`index.ts` pakai `env`. `.env.example` dibuat.

### 9.3 Security & reliability
- [x] Rate limiting (`express-rate-limit`) — penting banget karena last.fm/itunes/Claude API semua punya limit, jangan sampai 1 user spam bikin quota habis
- [x] Input sanitization tambahan buat auth endpoints
- [x] CORS production config (bukan lagi hardcode `localhost:5173`)
- [x] Secrets management — pastikan `LASTFM_API_KEY`, `ANTHROPIC_API_KEY`, DB credentials ga pernah ke-commit

**Selesai kalau:** tiap user/IP punya batas request, endpoint auth & AI di-protect, CORS pake env var, dan ga ada secret yang ke-commit.

> **Selesai (9.3):** `express-rate-limit` — `globalLimiter` (300/15m), `authLimiter` (20/15m di `/api/auth`), `aiLimiter` (30/15m di `/api/recommendation`). Sanitasi auth di shared schema: email di-lowercase, password max 128, displayName max 50. CORS baca `CORS_ORIGIN` (default localhost:5173) — sudah dari 9.1. Secrets: `.env` gitignored (diverifikasi), `.env.example` di-commit tanpa secret. Build + lint + api test (7 PASS) lulus.

### 9.4 Observability
- [x] Request logging (`pino` atau `morgan`)
- [x] Error logging/tracking (Sentry free tier cukup buat mulai)
- [x] Basic uptime monitoring buat API

**Selesai kalau:** tiap request ke-log, error nggak cuma nyangkut di console, dan ada endpoint health untuk uptime monitor.

> **Selesai (9.4):** `morgan` — format "dev" (dev) / "combined" (prod). Logger JSON terstruktur (`lib/logger.ts`) buat startup + unhandled error. Sentry opsional (`@sentry/node`) via `SENTRY_DSN` — kalau kosong di-skip; error handler capture sebelum 500. Uptime: `GET /api/health` + `GET /api/health/db` (SELECT 1, 503 kalau DB down). Smoke test: health ok, health/db up, rate-limit header aktif, auth/me 401 tanpa cookie. Build + lint + api test (7 PASS) lulus.

### 9.5 API documentation
- [x] OpenAPI/Swagger spec, atau minimal README per module yang list semua endpoint + contoh request/response

**Selesai kalau:** ada referensi lengkap semua endpoint (path, auth, request/response) yang bisa dibuka dev baru.

> **Selesai (9.5):** `apps/api/README.md` — daftar semua endpoint per modul (health, music, artists, discovery, auth, library, recommendation, genre, follow/notifications, stats), tabel method/path/auth, bentuk request/response, konvensi (cookie token, `{ data }`, rate limits, TTL cache). Milestone 9 selesai semua.

---

## Milestone 10 — Deployment

### 10.1 Persiapan
- [x] `.env.example` lengkap dengan semua var yang dibutuhin (last.fm, itunes ga butuh key, DB url, Anthropic key, session secret)
- [x] Production build test lokal dulu (`pnpm build` di semua workspace, pastikan ga ada error)
- [x] Database migration strategy final (Drizzle/Prisma migrate) dites di staging DB dulu

**Selesai kalau:** build lokal bersih, migration SQL tersedia & bisa di-apply ke staging/prod, dan prod start command jelas.

> **Selesai (10.1):** `pnpm build` semua workspace sukses (2 tasks). `start` API diganti `tsx src/index.ts` (produksi jalan dari TS source, aman karena `@sonora/shared` di-expose sebagai TS source). Migration: `drizzle-kit generate` → `drizzle/0000_outstanding_avengers.sql` + snapshot/journal; script `db:generate` / `db:migrate` / `db:push` ditambah. Turbo: `dist/**` di outputs + per-package `apps/api/turbo.json` (build = typecheck, tanpa artifact).

### 10.2 Deploy backend (Express API)
- [x] Pilih platform: Railway / Render / Fly.io (semua gampang buat Express + Postgres)
- [ ] Set semua environment variable di platform
- [ ] Configure CORS production — origin sesuai domain frontend production

**Selesai kalau:** API live, migration ke-apply, dan CORS cuma buka domain web sendiri.

> **Status (10.2):** platform dipilih = **Render**; `apps/api/render.yaml` (Blueprint) siap — build/start/preDeploy migration, env `sync: false` tinggal diisi di dashboard. `CORS_ORIGIN` placeholder di yaml, diganti domain web asli pas deploy. Set env var + deploy masih manual di dashboard Render (butuh akun).

### 10.3 Deploy frontend (Vite)
- [x] Vercel (paling gampang buat Vite static build)
- [ ] Set `VITE_API_URL` ke domain backend production
- [x] Configure redirect/rewrite buat client-side routing (biar `/artist/:name` ga 404 pas direct access)

**Selesai kalau:** web live di domain, bisa akses route langsung tanpa 404, dan nyambung ke API prod.

> **Status (10.3):** platform = **Vercel**; `apps/web/vercel.json` (rewrite SPA + `/playlist/shared/:token`) siap, `apps/web/.env.example` buat `VITE_API_URL`. Import repo + set env di dashboard Vercel masih manual (butuh akun). Panduan langkah: `docs/DEPLOYMENT.md`.

### 10.4 Post-deploy smoke test
- [ ] Search music & artist jalan
- [ ] Login/register jalan
- [ ] Favorite/playlist tersimpan
- [ ] Recommendation muncul (test dengan akun yang punya history)
- [ ] Cek response time — last.fm + itunes + Claude API dipanggil berurutan bisa lambat, pastikan ada loading state yang jelas, pertimbangkan caching lebih agresif kalau perlu

**Selesai kalau:** checklist di `docs/DEPLOYMENT.md` bagian "Post-deploy smoke test" semua hijau setelah deploy.

---

## Big picture — semua milestone

```
foundation         ████████████████████ 100%
music api          ████████████████████ 100%
artist api         ████████████████████ 100%
music frontend     ████████████████████ 100%
artist frontend    ████████████████████ 100%
discovery          ████████████████████ 100%
auth + db          ████████████████████ 100%
library            ████████████████████ 100%
ai recommendation  ████████████████████ 100%
feature expansion  ████████████████████ 100%   ← Milestone 8 (selesai)
production         ████████████████████ 100%   ← Milestone 9 (selesai)
deployment         ░░░░░░░░░░░░░░░░░░░░   0%   ← Milestone 10
```

### Urutan besar (kenapa urutannya gini)

```
artist frontend  →  discovery  →  auth+db  →  library  →  AI recommendation  →  production  →  deploy
```

- **Artist frontend & discovery dulu** — ini "core value" app (orang bisa explore musik) tanpa butuh akun sama sekali. Selesain dulu biar app udah *usable* dan bisa didemoin.
- **Auth + DB baru setelah itu** — jangan duluin auth sebelum ada fitur yang worth di-save. Kalau auth dibikin duluan tapi belum ada favorites/playlist, buat apa orang login?
- **Library sebelum AI** — AI recommendation butuh data user (favorites/history) buat personalisasi. Ga ada gunanya bikin AI kalau belum ada data buat "dipelajari".
- **Production & deploy paling akhir** — tapi jangan tunggu SEMUA milestone kelar buat mikirin ini. Environment variable structure, error handling pattern, dan logging **sebaiknya udah konsisten dari awal** (kamu udah mulai bagus soal ini di artist API), biar pas sampai milestone 8 tinggal "mengeraskan" apa yang udah ada, bukan refactor besar-besaran.

---