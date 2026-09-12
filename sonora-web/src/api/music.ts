import type { Music, TrackDetail } from ".../shared/index";
import { request } from "./client";

export async function searchMusic(query: string): Promise<Music[]> {
  const response = await request<{ data: Music[] }>(
    `/api/music/search?q=${encodeURIComponent(query)}`,
  );
  return response.data;
}

export async function getTrack(
  artist: string,
  track: string,
): Promise<TrackDetail> {
  const response = await request<{ data: TrackDetail }>(
    `/api/music/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`,
  );
  return response.data;
}

export async function getSimilarTracks(
  artist: string,
  track: string,
): Promise<Music[]> {
  const response = await request<{ data: Music[] }>(
    `/api/music/${encodeURIComponent(artist)}/${encodeURIComponent(track)}/similar`,
  );
  return response.data;
}