import type {
  ForYouResponse,
  MoodResponse,
  PlaylistDraftResponse,
  SimilarToResponse,
} from ".../shared/index";
import { request } from "./client";

export async function getForYou(): Promise<ForYouResponse> {
  return request<ForYouResponse>("/api/recommendation/for-you");
}

export async function getSimilarTo(artist: string): Promise<SimilarToResponse> {
  return request<SimilarToResponse>(
    `/api/recommendation/similar-to/${encodeURIComponent(artist)}`,
  );
}

export async function getMoodPlaylist(mood: string): Promise<MoodResponse> {
  return request<MoodResponse>("/api/recommendation/mood", {
    method: "POST",
    body: { mood },
  });
}

export async function getPlaylistDraft(
  prompt: string,
): Promise<PlaylistDraftResponse> {
  return request<PlaylistDraftResponse>("/api/recommendation/playlist-draft", {
    method: "POST",
    body: { prompt },
  });
}