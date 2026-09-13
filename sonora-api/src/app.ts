/// <reference lib="cloudflare" />

import { Hono } from "hono";
import { initDb } from "./db/client";
import { initLastFmConfig } from "./integrations/lastfm/lastfm.client";
import { initJwt } from "./lib/auth/jwt";

const app = new Hono();

const ALLOWED_ORIGINS = [
  "https://sonora.muhamadrizky.my.id",
  "http://localhost:5173",
  "https://sonora-web-three.vercel.app",
];

// Initialize services with env on each request
app.use("*", async (c, next) => {
  const env = c.env as Record<string, string>;
  
  try {
    initDb(env);
  } catch {
    // Already initialized
  }
  
  try {
    initLastFmConfig(env);
  } catch {
    // Already initialized
  }
  
  try {
    initJwt(env);
  } catch {
    // Already initialized
  }

  const origin = c.req.header("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  c.res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  c.res.headers.set("Access-Control-Allow-Credentials", "true");
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (c.req.method === "OPTIONS") return c.text("", 204);
  
  await next();
});

app.get("/api/health", (c) => c.json({ status: "ok", message: "sonora api is running" }));

import musicRouter from "./modules/music/music.routes";
import artistRoutes from "./modules/artist/artist.routes";
import discoveryRoutes from "./modules/discovery/discovery.routes";
import authRoutes from "./modules/auth/auth.routes";
import libraryRoutes from "./modules/library/library.routes";
import recommendationRoutes from "./modules/recommendation/recommendation.routes";
import genreRoutes from "./modules/genre/genre.routes";
import followRoutes from "./modules/follow/follow.routes";
import statsRoutes from "./modules/stats/stats.routes";

app.route("/api/music", musicRouter);
app.route("/api/artists", artistRoutes);
app.route("/api/discovery", discoveryRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/library", libraryRoutes);
app.route("/api/recommendation", recommendationRoutes);
app.route("/api/genre", genreRoutes);
app.route("/api", followRoutes);
app.route("/api/stats", statsRoutes);

export default app;
