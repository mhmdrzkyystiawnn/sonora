# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sonora is a music discovery platform built as a Turborepo monorepo with pnpm. It consists of a React frontend (Vite), an Express.js API backend, and a shared schema package.

## Apps

- **`apps/web`** - Vite + React 19 frontend with Tailwind CSS 4, React Router 7, shadcn/ui components. Runs on `http://localhost:5173`
- **`apps/api`** - Express.js 5 backend API with TypeScript. Runs on port 3000 (configurable via `PORT` env var). CORS is hardcoded to allow `http://localhost:5173`
- **`apps/docs`** - Next.js documentation app (present but deleted/stub files)

## Packages

- **`packages/shared`** - Shared Zod schemas and TypeScript types for API request/response validation. Used by both web and api

## Commands

```sh
# All apps (from root)
pnpm dev          # Run all apps in dev mode (turbo)
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm check-types  # Type-check all apps
pnpm format       # Format code with Prettier

# Single app
pnpm --filter @sonora/web dev    # Web frontend only
pnpm --filter @sonora/api dev    # API only

# Shared package
pnpm shared:add    # Add @sonora/shared to api and web
pnpm shared:remove # Remove @sonora/shared from api and web
```

## Architecture

```
apps/web/src/
├── api/          # API client functions (artist.ts, discovery.ts)
├── components/   # React components including ui/ (shadcn-style)
├── pages/        # Route pages (MusicSearch, ArtistSearch, ArtistDetail, Discovery)
└── App.tsx       # Main router setup with React Router 7

apps/api/src/
├── index.ts      # Express app entry point
├── modules/      # Route handlers organized by domain (music/, artist/, discovery/)
└── lib/          # Utilities

packages/shared/src/
├── index.ts      # Re-exports all schemas
└── schemas/      # Zod schemas (artist.schema.ts, music.schema.ts)
```

## API Routes

- `GET /api/health` - Health check
- `GET /api/music` - Music search
- `GET /api/artists` - Artist search
- `GET /api/discovery` - Discovery/featured content

## Key Dependencies

- **Web**: React 19, React Router 7, Tailwind CSS 4, shadcn/ui (Base UI), Lucide icons
- **API**: Express 5, cors, dotenv, tsx (dev runner), TypeScript
- **Shared**: Zod 4 for schema validation
