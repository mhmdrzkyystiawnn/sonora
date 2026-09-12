import type { ArtistSearchResult, Music } from "@sonora/shared";
import { request } from "./client";

export async function getPopularTracks(): Promise<Music[]> {
  return request<Music[]>("/api/discovery/popular-tracks");
}

export async function getPopularArtists(): Promise<ArtistSearchResult[]> {
  return request<ArtistSearchResult[]>("/api/discovery/popular-artists");
}