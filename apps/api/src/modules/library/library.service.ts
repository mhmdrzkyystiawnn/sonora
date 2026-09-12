import { and, asc, count, desc, eq, max } from "drizzle-orm";
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
import {
  favoriteKey,
  favoriteSchema,
  historyEntrySchema,
  playlistDetailSchema,
  playlistSchema,
  playlistTrackSchema,
  sharedPlaylistSchema,
} from "@sonora/shared";
import { randomBytesBase64 } from "../../lib/crypto-polyfill.ts";
import { db } from "../../db/client.ts";
import type {
  FavoriteRow,
  HistoryRow,
  PlaylistRow,
  PlaylistTrackRow,
} from "../../db/schema.ts";
import {
  favorites,
  playlistTracks,
  playlists,
  searchHistory,
} from "../../db/schema.ts";
import { ConflictError, NotFoundError } from "../../lib/api-error.ts";
import { invalidateRecommendationCache } from "../../lib/recommendation-cache.ts";

function toFavorite(row: FavoriteRow): Favorite {
  return favoriteSchema.parse({
    id: row.id,
    kind: row.kind,
    name: row.name,
    artistName: row.artistName,
    imageUrl: row.imageUrl,
    url: row.url,
    mbid: row.mbid,
    key: row.key,
    createdAt: row.createdAt.toISOString(),
  });
}

function toHistory(row: HistoryRow): HistoryEntry {
  return historyEntrySchema.parse({
    id: row.id,
    kind: row.kind,
    name: row.name,
    artistName: row.artistName,
    imageUrl: row.imageUrl,
    url: row.url,
    mbid: row.mbid,
    key: row.key,
    createdAt: row.createdAt.toISOString(),
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
    isPublic: row.isPublic,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toPlaylistTrack(row: PlaylistTrackRow): PlaylistTrack {
  return playlistTrackSchema.parse({
    id: row.id,
    name: row.name,
    artistName: row.artistName,
    imageUrl: row.imageUrl,
    url: row.url,
    mbid: row.mbid,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
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
    isPublic: row.isPublic,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    tracks,
  });
}

async function getOwnedPlaylist(userId: string, playlistId: string) {
  const [playlist] = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
    .limit(1);

  if (!playlist) {
    throw new NotFoundError("playlist not found");
  }

  return playlist;
}

export async function listFavorites(userId: string) {
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  return rows.map(toFavorite);
}

export async function addFavorite(userId: string, input: AddFavoriteInput) {
  const key = favoriteKey(input.kind, input.name, input.artistName);

  const [existing] = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.key, key)))
    .limit(1);

  if (existing) {
    throw new ConflictError("already favorited");
  }

  const [row] = await db
    .insert(favorites)
    .values({
      userId,
      kind: input.kind,
      name: input.name,
      artistName: input.artistName ?? null,
      imageUrl: input.imageUrl ?? null,
      url: input.url ?? null,
      mbid: input.mbid ?? null,
      key,
    })
    .returning();

  await invalidateRecommendationCache(userId, "for-you");

  return toFavorite(row);
}

export async function removeFavorite(userId: string, favoriteId: string) {
  const [deleted] = await db
    .delete(favorites)
    .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, userId)))
    .returning();

  if (!deleted) {
    throw new NotFoundError("favorite not found");
  }

  return toFavorite(deleted);
}

export async function listPlaylists(userId: string) {
  const rows = await db
    .select({
      id: playlists.id,
      userId: playlists.userId,
      name: playlists.name,
      description: playlists.description,
      isPublic: playlists.isPublic,
      shareToken: playlists.shareToken,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
      trackCount: count(playlistTracks.id),
    })
    .from(playlists)
    .leftJoin(playlistTracks, eq(playlistTracks.playlistId, playlists.id))
    .where(eq(playlists.userId, userId))
    .groupBy(playlists.id)
    .orderBy(desc(playlists.createdAt));

  return rows.map((row) => toPlaylistSummary(row, Number(row.trackCount)));
}

export async function createPlaylist(
  userId: string,
  input: CreatePlaylistInput,
) {
  const [row] = await db
    .insert(playlists)
    .values({
      userId,
      name: input.name,
      description: input.description ?? null,
    })
    .returning();

  return toPlaylistSummary(row, 0);
}

export async function getPlaylist(userId: string, playlistId: string) {
  const playlist = await getOwnedPlaylist(userId, playlistId);

  const tracks = await db
    .select()
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlist.id))
    .orderBy(asc(playlistTracks.position), asc(playlistTracks.createdAt));

  return toPlaylistDetail(playlist, tracks.map(toPlaylistTrack));
}

export async function updatePlaylist(
  userId: string,
  playlistId: string,
  input: UpdatePlaylistInput,
) {
  const values: Partial<typeof playlists.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    values.name = input.name;
  }

  if (input.description !== undefined) {
    values.description = input.description;
  }

  const [row] = await db
    .update(playlists)
    .set(values)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
    .returning();

  if (!row) {
    throw new NotFoundError("playlist not found");
  }

  const [{ value: trackCount }] = await db
    .select({ value: count(playlistTracks.id) })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, row.id));

  return toPlaylistSummary(row, Number(trackCount));
}

export async function deletePlaylist(userId: string, playlistId: string) {
  const [deleted] = await db
    .delete(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
    .returning();

  if (!deleted) {
    throw new NotFoundError("playlist not found");
  }
}

export async function sharePlaylist(
  userId: string,
  playlistId: string,
): Promise<SharePlaylistResponse> {
  const playlist = await getOwnedPlaylist(userId, playlistId);

  const token = playlist.shareToken ?? randomBytesBase64(18);

  if (!playlist.shareToken || !playlist.isPublic) {
    await db
      .update(playlists)
      .set({ isPublic: true, shareToken: token, updatedAt: new Date() })
      .where(eq(playlists.id, playlist.id));
  }

  return {
    token,
    url: `/playlist/shared/${token}`,
    isPublic: true,
  };
}

export async function unsharePlaylist(userId: string, playlistId: string) {
  const playlist = await getOwnedPlaylist(userId, playlistId);

  await db
    .update(playlists)
    .set({ isPublic: false, shareToken: null, updatedAt: new Date() })
    .where(eq(playlists.id, playlist.id));
}

export async function getSharedPlaylist(token: string): Promise<SharedPlaylist> {
  const [playlist] = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.shareToken, token), eq(playlists.isPublic, true)))
    .limit(1);

  if (!playlist) {
    throw new NotFoundError("shared playlist not found");
  }

  const tracks = await db
    .select()
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlist.id))
    .orderBy(asc(playlistTracks.position), asc(playlistTracks.createdAt));

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

  const [{ value: maxPosition }] = await db
    .select({ value: max(playlistTracks.position) })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlist.id));

  try {
    const [row] = await db
      .insert(playlistTracks)
      .values({
        playlistId: playlist.id,
        name: input.name,
        artistName: input.artistName,
        imageUrl: input.imageUrl ?? null,
        url: input.url ?? null,
        mbid: input.mbid ?? null,
        position: (maxPosition ?? 0) + 1,
      })
      .returning();

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

  const [deleted] = await db
    .delete(playlistTracks)
    .where(
      and(
        eq(playlistTracks.id, trackId),
        eq(playlistTracks.playlistId, playlist.id),
      ),
    )
    .returning();

  if (!deleted) {
    throw new NotFoundError("playlist track not found");
  }
}

export async function listHistory(userId: string) {
  const rows = await db
    .select()
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(30);

  return rows.map(toHistory);
}

export async function logHistory(userId: string, input: LogHistoryInput) {
  const key = favoriteKey(input.kind, input.name, input.artistName);

  const [row] = await db
    .insert(searchHistory)
    .values({
      userId,
      kind: input.kind,
      name: input.name,
      artistName: input.artistName ?? null,
      imageUrl: input.imageUrl ?? null,
      url: input.url ?? null,
      mbid: input.mbid ?? null,
      key,
    })
    .onConflictDoUpdate({
      target: [searchHistory.userId, searchHistory.key],
      set: { createdAt: new Date() },
    })
    .returning();

  return toHistory(row);
}
