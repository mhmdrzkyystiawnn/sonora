# Sonora — Deployment Guide

Target stack:
- **Web** → Vercel (static Vite build)
- **API** → Render (Express, run via `tsx`)
- **DB** → Supabase Postgres (already used for dev)
- **Shared** → `@sonora/shared`, consumed as TS source by both (workspace)

Config files already in repo: `apps/api/render.yaml`, `apps/web/vercel.json`,
`apps/web/.env.example`, `apps/api/.env.example`.

---

## 1. API — Render

1. Push the repo to GitHub.
2. Render Dashboard → **New** → **Blueprint** → connect repo. Render reads
   `apps/api/render.yaml` (or: New + Web Service and point to `apps/api`).
3. In the service, fill the **sync: false** env vars (secret values):
   - `DATABASE_URL` — Supabase **Transaction pooler** URL
   - `JWT_SECRET` — random 32 bytes hex (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `JWT_EXPIRES_IN` — e.g. `7d`
   - `LASTFM_API_KEY`, `LASTFM_SHARED_SECRET`
   - `GEMINI_API_KEY`
   - `SENTRY_DSN` — optional, leave empty to disable
4. Set `CORS_ORIGIN` to the deployed web URL (e.g. `https://sonora.vercel.app`).
5. Deploy. Migrations run automatically via `preDeployCommand`
   (`pnpm --filter @sonora/api db:migrate`).

> If you deploy without a Blueprint, use:
> build: `corepack enable && pnpm install --frozen-lockfile`
> start: `pnpm --filter @sonora/api start`
> pre-deploy: `pnpm --filter @sonora/api db:migrate`

---

## 2. Web — Vercel

1. Vercel → **New Project** → import the same repo.
2. Framework: **Vite**. Root directory: `apps/web`.
3. Build command: `pnpm --filter @sonora/web build` (or `pnpm install --frozen-lockfile && pnpm build`)
   Output dir: `dist`.
4. Add env var `VITE_API_URL` = the deployed API URL (e.g. `https://sonora-api.onrender.com`).
   Vercel requires it at build time — it is baked into the JS bundle.
5. Deploy. `vercel.json` already rewrites SPA routes (e.g. `/artist/:name`,
   `/playlist/shared/:token`) to `index.html`.

---

## 3. Post-deploy smoke test

Run through this checklist after both services are live:

- [ ] `GET <api>/api/health` → `status: ok`
- [ ] `GET <api>/api/health/db` → `db: up`
- [ ] Web loads; search music & search artist return results
- [ ] Register + login work (cookie-based, same-origin check: `CORS_ORIGIN` correct)
- [ ] Favorite a track → shows in Library; create playlist → add track
- [ ] Recommendation: on an account with history/favorites, "Recommended for You" returns
      `source: ai` (or `lastfm` fallback) — Mood Mixes returns tracks
- [ ] Share a playlist → anonymous user (incognito) can open the shared link
- [ ] Check response times: last.fm + iTunes are cached (24h) server-side; if slow,
      add a more aggressive cache layer or CDN on `/api/discovery/*`

---

## 4. Local vs production notes

- Local dev uses `http://localhost:3000` for the API; production uses `VITE_API_URL`.
- Cookies: `secure` is set only when `NODE_ENV=production`, so cross-origin auth relies
  on CORS `credentials: true` (already configured).
- Never commit `.env` files — only `.env.example`.
