import type { Artist, ArtistSearchResult, Music } from "@sonora/shared";
import { request } from "./client";

export async function searchArtists(
  query: string,
): Promise<ArtistSearchResult[]> {
  const response = await request<{ data: ArtistSearchResult[] }>(
    `/api/artists/search?q=${encodeURIComponent(query)}`,
  );
  return response.data;
}

export async function getArtist(name: string): Promise<Artist> {
  const response = await request<{ data: Artist }>(
    `/api/artists/${encodeURIComponent(name)}`,
  );
  return response.data;
}

export async function getArtistTopTracks(name: string): Promise<Music[]> {
  const response = await request<{ data: Music[] }>(
    `/api/artists/${encodeURIComponent(name)}/tracks`,
  );
  return response.data;
}

export async function getSimilarArtists(
  name: string,
): Promise<ArtistSearchResult[]> {
  const response = await request<{ data: ArtistSearchResult[] }>(
    `/api/artists/${encodeURIComponent(name)}/similar`,
  );
  return response.data;
}