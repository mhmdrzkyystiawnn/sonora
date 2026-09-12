import type { Context } from "hono";
import * as discoveryService from "./discovery.service.ts";

export async function getPopularTracks(c: Context) {
  const tracks = await discoveryService.getPopularTracks();
  return c.json(tracks);
}

export async function getPopularArtists(c: Context) {
  const artists = await discoveryService.getPopularArtists();
  return c.json(artists);
}
