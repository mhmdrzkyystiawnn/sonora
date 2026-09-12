import type {
  AddFavoriteInput,
  AddPlaylistTrackInput,
  CreatePlaylistInput,
  Favorite,
  HistoryEntry,
  LogHistoryInput,
  Playlist,
  PlaylistDetail,
  PlaylistTrack,
  SharePlaylistResponse,
  SharedPlaylist,
  UpdatePlaylistInput,
} from "@sonora/shared";
import { request } from "./client";

export async function getFavorites(): Promise<Favorite[]> {
  const response = await request<{ data: Favorite[] }>("/api/library/favorites");
  return response.data;
}

export async function addFavorite(input: AddFavoriteInput): Promise<Favorite> {
  const response = await request<{ data: Favorite }>("/api/library/favorites", {
    method: "POST",
    body: input,
  });
  return response.data;
}

export async function removeFavorite(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/library/favorites/${id}`, {
    method: "DELETE",
  });
}

export async function getPlaylists(): Promise<Playlist[]> {
  const response = await request<{ data: Playlist[] }>("/api/library/playlists");
  return response.data;
}

export async function createPlaylist(input: CreatePlaylistInput): Promise<Playlist> {
  const response = await request<{ data: Playlist }>("/api/library/playlists", {
    method: "POST",
    body: input,
  });
  return response.data;
}

export async function getPlaylist(id: string): Promise<PlaylistDetail> {
  const response = await request<{ data: PlaylistDetail }>(
    `/api/library/playlists/${id}`,
  );
  return response.data;
}

export async function updatePlaylist(
  id: string,
  input: UpdatePlaylistInput,
): Promise<Playlist> {
  const response = await request<{ data: Playlist }>(
    `/api/library/playlists/${id}`,
    {
      method: "PATCH",
      body: input,
    },
  );
  return response.data;
}

export async function deletePlaylist(id: string): Promise<void> {
  await request<{ success: boolean }>(`/api/library/playlists/${id}`, {
    method: "DELETE",
  });
}

export async function addPlaylistTrack(
  id: string,
  input: AddPlaylistTrackInput,
): Promise<PlaylistTrack> {
  const response = await request<{ data: PlaylistTrack }>(
    `/api/library/playlists/${id}/tracks`,
    {
      method: "POST",
      body: input,
    },
  );
  return response.data;
}

export async function removePlaylistTrack(
  id: string,
  trackId: string,
): Promise<void> {
  await request<{ success: boolean }>(
    `/api/library/playlists/${id}/tracks/${trackId}`,
    { method: "DELETE" },
  );
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const response = await request<{ data: HistoryEntry[] }>("/api/library/history");
  return response.data;
}

export async function logHistory(input: LogHistoryInput): Promise<void> {
  await request<{ data: HistoryEntry }>("/api/library/history", {
    method: "POST",
    body: input,
  });
}

export async function sharePlaylist(
  id: string,
): Promise<SharePlaylistResponse> {
  const response = await request<{ data: SharePlaylistResponse }>(
    `/api/library/playlists/${id}/share`,
    { method: "POST" },
  );
  return response.data;
}

export async function unsharePlaylist(id: string): Promise<void> {
  await request<{ success: boolean }>(
    `/api/library/playlists/${id}/unshare`,
    { method: "POST" },
  );
}

export async function getSharedPlaylist(token: string): Promise<SharedPlaylist> {
  const response = await request<{ data: SharedPlaylist }>(
    `/api/playlists/shared/${encodeURIComponent(token)}`,
  );
  return response.data;
}