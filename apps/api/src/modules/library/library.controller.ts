import type { Context } from "hono";
import {
  addFavoriteSchema,
  addPlaylistTrackSchema,
  createPlaylistSchema,
  logHistorySchema,
  updatePlaylistSchema,
} from "@sonora/shared";
import * as libraryService from "./library.service.ts";
import { NotFoundError } from "../../lib/api-error.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseId(raw: string | string[] | undefined): string {
  if (typeof raw !== "string" || !UUID_PATTERN.test(raw)) {
    throw new NotFoundError("resource not found");
  }

  return raw;
}

function paramValue(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

function getUserId(c: Context): string {
  return c.get("userId") as string;
}

export async function listFavoritesController(c: Context) {
  const favorites = await libraryService.listFavorites(getUserId(c));
  return c.json({ data: favorites });
}

export async function addFavoriteController(c: Context) {
  const body = await c.req.json();
  const input = addFavoriteSchema.safeParse(body);

  if (!input.success) {
    return c.json({ error: "invalid input", issues: input.error.issues }, 400);
  }

  const favorite = await libraryService.addFavorite(getUserId(c), input.data);
  return c.json({ data: favorite }, 201);
}

export async function removeFavoriteController(c: Context) {
  const favoriteId = parseId(c.req.param("id"));
  await libraryService.removeFavorite(getUserId(c), favoriteId);
  return c.json({ success: true });
}

export async function listPlaylistsController(c: Context) {
  const playlists = await libraryService.listPlaylists(getUserId(c));
  return c.json({ data: playlists });
}

export async function createPlaylistController(c: Context) {
  const body = await c.req.json();
  const input = createPlaylistSchema.safeParse(body);

  if (!input.success) {
    return c.json({ error: "invalid input", issues: input.error.issues }, 400);
  }

  const playlist = await libraryService.createPlaylist(getUserId(c), input.data);
  return c.json({ data: playlist }, 201);
}

export async function getPlaylistController(c: Context) {
  const playlistId = parseId(c.req.param("id"));
  const playlist = await libraryService.getPlaylist(getUserId(c), playlistId);
  return c.json({ data: playlist });
}

export async function updatePlaylistController(c: Context) {
  const playlistId = parseId(c.req.param("id"));
  const body = await c.req.json();
  const input = updatePlaylistSchema.safeParse(body);

  if (!input.success) {
    return c.json({ error: "invalid input", issues: input.error.issues }, 400);
  }

  const playlist = await libraryService.updatePlaylist(
    getUserId(c),
    playlistId,
    input.data,
  );
  return c.json({ data: playlist });
}

export async function deletePlaylistController(c: Context) {
  const playlistId = parseId(c.req.param("id"));
  await libraryService.deletePlaylist(getUserId(c), playlistId);
  return c.json({ success: true });
}

export async function addPlaylistTrackController(c: Context) {
  const playlistId = parseId(c.req.param("id"));
  const body = await c.req.json();
  const input = addPlaylistTrackSchema.safeParse(body);

  if (!input.success) {
    return c.json({ error: "invalid input", issues: input.error.issues }, 400);
  }

  const track = await libraryService.addPlaylistTrack(
    getUserId(c),
    playlistId,
    input.data,
  );
  return c.json({ data: track }, 201);
}

export async function removePlaylistTrackController(c: Context) {
  const playlistId = parseId(c.req.param("id"));
  const trackId = parseId(c.req.param("trackId"));
  await libraryService.removePlaylistTrack(getUserId(c), playlistId, trackId);
  return c.json({ success: true });
}

export async function listHistoryController(c: Context) {
  const history = await libraryService.listHistory(getUserId(c));
  return c.json({ data: history });
}

export async function sharePlaylistController(c: Context) {
  const playlistId = parseId(c.req.param("id"));
  const result = await libraryService.sharePlaylist(getUserId(c), playlistId);
  return c.json({ data: result });
}

export async function unsharePlaylistController(c: Context) {
  const playlistId = parseId(c.req.param("id"));
  await libraryService.unsharePlaylist(getUserId(c), playlistId);
  return c.json({ success: true });
}

export async function sharedPlaylistController(c: Context) {
  const token = c.req.param("token") ?? "";
  const playlist = await libraryService.getSharedPlaylist(token);
  return c.json({ data: playlist });
}

export async function logHistoryController(c: Context) {
  const body = await c.req.json();
  const input = logHistorySchema.safeParse(body);

  if (!input.success) {
    return c.json({ error: "invalid input", issues: input.error.issues }, 400);
  }

  const entry = await libraryService.logHistory(getUserId(c), input.data);
  return c.json({ data: entry }, 201);
}
