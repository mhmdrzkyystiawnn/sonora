import type { Context } from "hono";
import {
  artistTracksQuerySchema,
  artistTracksResponseSchema,
} from "../../shared/index.js";
import { searchArtist, getArtist, getArtistTopTracks, getSimilarArtists } from "./artist.service.ts";

export async function searchArtistController(c: Context) {
  const query = c.req.query("q")?.trim() ?? "";

  if (!query) {
    return c.json({ error: "query parameter 'q' is required" }, 400);
  }

  const artists = await searchArtist(query);

  return c.json({ data: artists });
}

export async function getArtistController(c: Context) {
  const artist = c.req.param("artist")?.trim() ?? "";

  if (!artist) {
    return c.json({ error: "artist parameter is required" }, 400);
  }

  const data = await getArtist(artist);
  return c.json({ data });
}

export async function getArtistTopTracksController(c: Context) {
  const queryResult = artistTracksQuerySchema.safeParse(c.req.query());

  if (!queryResult.success) {
    return c.json({
      error: "invalid query",
      issues: queryResult.error.issues,
    }, 400);
  }

  const artist = c.req.param("artist")?.trim() ?? "";

  if (!artist) {
    return c.json({
      error: "artist parameter is required",
    }, 400);
  }

  const result =
    await getArtistTopTracks(artist, queryResult.data);

  const response = artistTracksResponseSchema.parse({
    artist,
    ...queryResult.data,
    ...result,
  });

  return c.json(response);
}

export async function getSimilarArtistsController(c: Context) {
  const artist = c.req.param("artist")?.trim() ?? "";

  if (!artist) {
    return c.json({ error: "artist parameter is required" }, 400);
  }

  const data = await getSimilarArtists(artist);
  return c.json({ data });
}
