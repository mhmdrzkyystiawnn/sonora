import type { Context } from "hono";
import {
  isKnownGenre,
  genreTracksQuerySchema,
  genreTracksResponseSchema,
} from "../../shared/index.js";
import { NotFoundError } from "../../lib/api-error.ts";
import * as genreService from "./genre.service.ts";

function parseTag(c: Context): string {
  const raw = c.req.param("tag");
  const tag = raw ? decodeURIComponent(raw) : "";

  if (!isKnownGenre(tag)) {
    throw new NotFoundError(`genre "${tag}" not found`);
  }

  return tag;
}

export async function genreTracksController(c: Context) {
  const queryResult = genreTracksQuerySchema.safeParse(c.req.query());

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
    const tag = parseTag(c);
    const result = await genreService.getGenreTracks(tag, queryResult.data);
    const response = genreTracksResponseSchema.parse({ tag, ...result });
    return c.json(response);
  } catch (error) {
    throw error;
  }
}

export async function genreArtistsController(c: Context) {
  try {
    const tag = parseTag(c);
    const data = await genreService.getGenreArtists(tag);
    return c.json({ tag, data });
  } catch (error) {
    throw error;
  }
}
