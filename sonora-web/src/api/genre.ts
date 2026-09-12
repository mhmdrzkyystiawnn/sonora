import type { ArtistSearchResult, GenreTracksResponse } from ".../shared/index";
import { request } from "./client";

export async function getGenreTracks(
  tag: string,
  page = 1,
): Promise<GenreTracksResponse> {
  return request<GenreTracksResponse>(
    `/api/genre/${encodeURIComponent(tag)}/tracks?page=${page}`,
  );
}

export async function getGenreArtists(
  tag: string,
): Promise<ArtistSearchResult[]> {
  const response = await request<{ tag: string; data: ArtistSearchResult[] }>(
    `/api/genre/${encodeURIComponent(tag)}/artists`,
  );
  return response.data;
}