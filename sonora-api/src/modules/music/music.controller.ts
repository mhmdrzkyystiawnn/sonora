import type { Context } from "hono";
import {
  musicSearchQuerySchema,
  musicSearchResponseSchema,
} from "../../shared/index.js";
import { searchMusic, getSimilarTracks, getTrack } from "./music.service.ts";

export async function searchMusicController(c: Context) {
  const queryResult = musicSearchQuerySchema.safeParse(c.req.query());

  if (!queryResult.success) {
    return c.json(
      {
        error: "invalid query",
        issues: queryResult.error.issues,
      },
      400,
    );
  }

  try {
    const music = await searchMusic(queryResult.data.q);

    const response = musicSearchResponseSchema.parse({
      data: music,
    });

    return c.json(response);
  } catch (error) {
    throw error;
  }
}

export async function getSimilarTracksController(c: Context) {
  try {
    const artist = String(c.req.param("artist") ?? "").trim();
    const track = String(c.req.param("track") ?? "").trim();

    if (!artist || !track) {
      return c.json(
        { error: "artist and track parameters are required" },
        400,
      );
    }

    const data = await getSimilarTracks(artist, track);
    return c.json({ data });
  } catch (error) {
    throw error;
  }
}

export async function getTrackController(c: Context) {
  try {
    const artist = String(c.req.param("artist") ?? "").trim();
    const track = String(c.req.param("track") ?? "").trim();

    if (!artist || !track) {
      return c.json(
        { error: "artist and track parameters are required" },
        400,
      );
    }

    const data = await getTrack(artist, track);
    return c.json({ data });
  } catch (error) {
    throw error;
  }
}
