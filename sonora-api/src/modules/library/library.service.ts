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
} from "../../shared/index.js";
import {
  favoriteKey,
  favoriteSchema,
  historyEntrySchema,
  playlistDetailSchema,
  playlistSchema,
  playlistTrackSchema,
  sharedPlaylistSchema,
} from "../../shared/index.js";
import { randomBytesBase64 } from "../../lib/crypto-polyfill.ts";
import { db } from "../../db/client.ts";
import { ConflictError, NotFoundError } from "../../lib/api-error.ts";
import { invalidateRecommendationCache } from "../../lib/recommendation-cache.ts";

interface FavoriteRow {
  id: string;
  user_id: string;
  kind: string;
  name: string;
  artist_name: string | null;
  image_url: string | null;
  url: string | null;
  mbid: string | null;
  key: string;
  created_at: Date;
}

interface HistoryRow {
  id: string;
  user_id: string;
  kind: string;
  name: string;
  artist_name: string | null;
  image_url: string | null;
  url: string | null;
  mbid: string | null;
  key: string;
  created_at: Date;
}

interface PlaylistRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  share_token: string | null;
  created_at: Date;
  updated_at: Date;
}

interface PlaylistTrackRow {
  id: string;
  playlist_id: string;
  name: string;
  artist_name: string;
  image_url: string | null;
  url: string | null;
  mbid: string | null;
  position: number;
  created_at: Date;
}

function toFavorite(row: FavoriteRow): Favorite {
  return favoriteSchema.parse({
    id: row.id,
    kind: row.kind,
    name: row.name,
    artistName: row.artist_name,
    imageUrl: row.image_url,
    url: row.url,
    mbid: row.mbid,
    key: row.key,
    createdAt: row.created_at.toISOString(),
  });
}

function toHistory(row: HistoryRow): HistoryEntry {
  return historyEntrySchema.parse({
    id: row.id,
    kind: row.kind,
    name: row.name,
    artistName: row.artist_name,
    imageUrl: row.image_url,
    url: row.url,
    mbid: row.mbid,
    key: row.key,
    createdAt: row.created_at.toISOString(),
  });
}

function toPlaylistSummary(
  row: PlaylistRow,
  trackCount: number,
): Playlist {
  return playlistSchema.parse({
    id: row.id,
    name: row.name,
    description: row.description,
    trackCount,
    isPublic: row.is_public,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  });
}

function toPlaylistTrack(row: PlaylistTrackRow): PlaylistTrack {
  return playlistTrackSchema.parse({
    id: row.id,
    name: row.name,
    artistName: row.artist_name,
    imageUrl: row.image_url,
    url: row.url,
    mbid: row.mbid,
    position: row.position,
    createdAt: row.created_at.toISOString(),
  });
}

function toPlaylistDetail(
  row: PlaylistRow,
  tracks: PlaylistTrack[],
): PlaylistDetail {
  return playlistDetailSchema.parse({
    id: row.id,
    name: row.name,
    description: row.description,
    isPublic: row.is_public,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    tracks,
  });
}

async function getOwnedPlaylist(userId: string, playlistId: string) {
  const [playlist] = await db.query<PlaylistRow>(
    "SELECT * FROM playlists WHERE id = $1 AND user_id = $2 LIMIT 1",
    [playlistId, userId],
  );

  if (!playlist) {
    throw new NotFoundError("playlist not found");
  }

  return playlist;
}

export async function listFavorites(userId: string) {
  const rows = await db.query<FavoriteRow>(
    "SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );

  return rows.map(toFavorite);
}

export async function addFavorite(userId: string, input: AddFavoriteInput) {
  const key = favoriteKey(input.kind, input.name, input.artistName);

  const existing = await db.query<{ id: string }>(
    "SELECT id FROM favorites WHERE user_id = $1 AND key = $2 LIMIT 1",
    [userId, key],
  );

  if (existing.length > 0) {
    throw new ConflictError("already favorited");
  }

  const [row] = await db.query<FavoriteRow>(
    `INSERT INTO favorites (user_id, kind, name, artist_name, image_url, url, mbid, key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      input.kind,
      input.name,
      input.artistName ?? null,
      input.imageUrl ?? null,
      input.url ?? null,
      input.mbid ?? null,
      key,
    ],
  );

  await invalidateRecommendationCache(userId, "for-you");

  return toFavorite(row);
}

export async function removeFavorite(userId: string, favoriteId: string) {
  const [deleted] = await db.query<FavoriteRow>(
    "DELETE FROM favorites WHERE id = $1 AND user_id = $2 RETURNING *",
    [favoriteId, userId],
  );

  if (!deleted) {
    throw new NotFoundError("favorite not found");
  }

  return toFavorite(deleted);
}

export async function listPlaylists(userId: string) {
  const rows = await db.query<PlaylistRow & { track_count: number }>(
    `SELECT p.*, COUNT(pt.id) AS track_count
     FROM playlists p
     LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
     WHERE p.user_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [userId],
  );

  return rows.map((row) => toPlaylistSummary(row, Number(row.track_count)));
}

export async function createPlaylist(
  userId: string,
  input: CreatePlaylistInput,
) {
  const [row] = await db.query<PlaylistRow>(
    `INSERT INTO playlists (user_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, input.name, input.description ?? null],
  );

  return toPlaylistSummary(row, 0);
}

export async function getPlaylist(userId: string, playlistId: string) {
  const playlist = await getOwnedPlaylist(userId, playlistId);

  const tracks = await db.query<PlaylistTrackRow>(
    "SELECT * FROM playlist_tracks WHERE playlist_id = $1 ORDER BY position ASC, created_at ASC",
    [playlist.id],
  );

  return toPlaylistDetail(playlist, tracks.map(toPlaylistTrack));
}

export async function updatePlaylist(
  userId: string,
  playlistId: string,
  input: UpdatePlaylistInput,
) {
  const fields: string[] = ["updated_at = now()"];
  const params: unknown[] = [];
  let idx = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`);
    params.push(input.name);
  }

  if (input.description !== undefined) {
    fields.push(`description = $${idx++}`);
    params.push(input.description);
  }

  params.push(playlistId, userId);

  const [row] = await db.query<PlaylistRow>(
    `UPDATE playlists
     SET ${fields.join(", ")}
     WHERE id = $${idx++} AND user_id = $${idx}
     RETURNING *`,
    params,
  );

  if (!row) {
    throw new NotFoundError("playlist not found");
  }

  const [{ track_count }] = await db.query<{ track_count: number }>(
    "SELECT COUNT(*) AS track_count FROM playlist_tracks WHERE playlist_id = $1",
    [row.id],
  );

  return toPlaylistSummary(row, Number(track_count));
}

export async function deletePlaylist(userId: string, playlistId: string) {
  const [deleted] = await db.query<PlaylistRow>(
    "DELETE FROM playlists WHERE id = $1 AND user_id = $2 RETURNING *",
    [playlistId, userId],
  );

  if (!deleted) {
    throw new NotFoundError("playlist not found");
  }
}

export async function sharePlaylist(
  userId: string,
  playlistId: string,
): Promise<SharePlaylistResponse> {
  const playlist = await getOwnedPlaylist(userId, playlistId);

  const token = playlist.share_token ?? randomBytesBase64(18);

  if (!playlist.share_token || !playlist.is_public) {
    await db.query(
      "UPDATE playlists SET is_public = true, share_token = $1, updated_at = now() WHERE id = $2",
      [token, playlist.id],
    );
  }

  return {
    token,
    url: `/playlist/shared/${token}`,
    isPublic: true,
  };
}

export async function unsharePlaylist(userId: string, playlistId: string) {
  const playlist = await getOwnedPlaylist(userId, playlistId);

  await db.query(
    "UPDATE playlists SET is_public = false, share_token = NULL, updated_at = now() WHERE id = $1",
    [playlist.id],
  );
}

export async function getSharedPlaylist(token: string): Promise<SharedPlaylist> {
  const [playlist] = await db.query<PlaylistRow>(
    "SELECT * FROM playlists WHERE share_token = $1 AND is_public = true LIMIT 1",
    [token],
  );

  if (!playlist) {
    throw new NotFoundError("shared playlist not found");
  }

  const tracks = await db.query<PlaylistTrackRow>(
    "SELECT * FROM playlist_tracks WHERE playlist_id = $1 ORDER BY position ASC, created_at ASC",
    [playlist.id],
  );

  return sharedPlaylistSchema.parse({
    name: playlist.name,
    description: playlist.description,
    tracks: tracks.map(toPlaylistTrack),
  });
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const direct = (error as { code?: string }).code;
  const caused = (error as { cause?: { code?: string } }).cause?.code;

  return direct === "23505" || caused === "23505";
}

export async function addPlaylistTrack(
  userId: string,
  playlistId: string,
  input: AddPlaylistTrackInput,
) {
  const playlist = await getOwnedPlaylist(userId, playlistId);

  const [{ max_position }] = await db.query<{ max_position: number | null }>(
    "SELECT MAX(position) AS max_position FROM playlist_tracks WHERE playlist_id = $1",
    [playlist.id],
  );

  try {
    const [row] = await db.query<PlaylistTrackRow>(
      `INSERT INTO playlist_tracks (playlist_id, name, artist_name, image_url, url, mbid, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        playlist.id,
        input.name,
        input.artistName,
        input.imageUrl ?? null,
        input.url ?? null,
        input.mbid ?? null,
        (max_position ?? 0) + 1,
      ],
    );

    return toPlaylistTrack(row);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("track already in playlist");
    }
    throw error;
  }
}

export async function removePlaylistTrack(
  userId: string,
  playlistId: string,
  trackId: string,
) {
  const playlist = await getOwnedPlaylist(userId, playlistId);

  const [deleted] = await db.query<PlaylistTrackRow>(
    "DELETE FROM playlist_tracks WHERE id = $1 AND playlist_id = $2 RETURNING *",
    [trackId, playlist.id],
  );

  if (!deleted) {
    throw new NotFoundError("playlist track not found");
  }
}

export async function listHistory(userId: string) {
  const rows = await db.query<HistoryRow>(
    "SELECT * FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30",
    [userId],
  );

  return rows.map(toHistory);
}

export async function logHistory(userId: string, input: LogHistoryInput) {
  const key = favoriteKey(input.kind, input.name, input.artistName);

  const [row] = await db.query<HistoryRow>(
    `INSERT INTO search_history (user_id, kind, name, artist_name, image_url, url, mbid, key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id, key) DO UPDATE SET created_at = now()
     RETURNING *`,
    [
      userId,
      input.kind,
      input.name,
      input.artistName ?? null,
      input.imageUrl ?? null,
      input.url ?? null,
      input.mbid ?? null,
      key,
    ],
  );

  return toHistory(row);
}
