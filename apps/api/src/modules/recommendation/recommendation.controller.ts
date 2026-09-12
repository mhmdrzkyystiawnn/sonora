import type { Context } from "hono";
import { moodRequestSchema, playlistDraftRequestSchema } from "@sonora/shared";
import * as recommendationService from "./recommendation.service.ts";

function getUserId(c: Context): string {
  return c.get("userId") as string;
}

export async function forYouController(c: Context) {
  const result = await recommendationService.getForYou(getUserId(c));
  return c.json(result);
}

export async function similarToController(c: Context) {
  const raw = c.req.param("artist");
  const artist = raw ? decodeURIComponent(raw) : "";

  if (!artist.trim()) {
    return c.json({ error: "invalid input" }, 400);
  }

  const result = await recommendationService.getSimilarTo(artist);
  return c.json(result);
}

export async function moodController(c: Context) {
  const body = await c.req.json();
  const parsed = moodRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "invalid input" }, 400);
  }

  const mood = parsed.data.mood.trim();

  if (!mood) {
    return c.json({ error: "invalid input" }, 400);
  }

  const result = await recommendationService.getMoodPlaylist(
    getUserId(c),
    mood,
  );
  return c.json(result);
}

export async function playlistDraftController(c: Context) {
  const body = await c.req.json();
  const parsed = playlistDraftRequestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "invalid input" }, 400);
  }

  const prompt = parsed.data.prompt.trim();

  if (!prompt) {
    return c.json({ error: "invalid input" }, 400);
  }

  const result = await recommendationService.getPlaylistDraft(prompt);
  return c.json(result);
}
