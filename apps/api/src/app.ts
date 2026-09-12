import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./lib/env.ts";
import { db } from "./db/client.ts";
import { sql } from "drizzle-orm";
import { ApiError } from "./lib/api-error.ts";
import musicRouter from "./modules/music/music.routes.ts";
import artistRoutes from "./modules/artist/artist.routes.ts";
import discoveryRoutes from "./modules/discovery/discovery.routes.ts";
import authRoutes from "./modules/auth/auth.routes.ts";
import libraryRoutes from "./modules/library/library.routes.ts";
import recommendationRoutes from "./modules/recommendation/recommendation.routes.ts";
import genreRoutes from "./modules/genre/genre.routes.ts";
import followRoutes from "./modules/follow/follow.routes.ts";
import statsRoutes from "./modules/stats/stats.routes.ts";
import { sharedPlaylistController } from "./modules/library/library.controller.ts";

export const app = new Hono();

app.use("*", logger());
app.use("*", cors({
  origin: env.CORS_ORIGIN ?? "http://localhost:5173",
  credentials: true,
}));

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    message: "sonora api is running",
  });
});

app.get("/api/health/db", async (c) => {
  try {
    await db.execute(sql`select 1`);
    return c.json({ status: "ok", db: "up" });
  } catch (error) {
    return c.json({ status: "error", db: "down" }, { status: 503 });
  }
});

app.route("/api/music", musicRouter);
app.route("/api/artists", artistRoutes);
app.route("/api/discovery", discoveryRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/library", libraryRoutes);
app.route("/api/recommendation", recommendationRoutes);
app.route("/api/genre", genreRoutes);
app.route("/api", followRoutes);
app.route("/api/stats", statsRoutes);

app.get("/api/playlists/shared/:token", sharedPlaylistController);

app.notFound((c) => {
  return c.json({ error: `route ${c.req.method} ${c.req.path} not found` }, { status: 404 });
});

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: err.message }, err.statusCode as Parameters<typeof c.json>[1]);
  }

  console.error("unhandled error", { message: err.message, stack: err.stack });
  return c.json({ error: "internal server error" }, 500);
});
