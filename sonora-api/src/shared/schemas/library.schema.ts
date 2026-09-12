import { z } from "zod";

export const favoriteKindSchema = z.enum(["track", "artist"]);

export type FavoriteKind = z.infer<typeof favoriteKindSchema>;

export function favoriteKey(
  kind: FavoriteKind,
  name: string,
  artistName?: string | null,
): string {
  const normalizedName = name.trim().toLowerCase();

  if (kind === "track") {
    return `track:${(artistName ?? "").trim().toLowerCase()}:${normalizedName}`;
  }

  return `artist:${normalizedName}`;
}

export const favoriteSchema = z.object({
  id: z.string(),
  kind: favoriteKindSchema,
  name: z.string(),
  artistName: z.string().nullable(),
  imageUrl: z.string().nullable(),
  url: z.string().nullable(),
  mbid: z.string().nullable(),
  key: z.string(),
  createdAt: z.string(),
});

export const addFavoriteSchema = z.object({
  kind: favoriteKindSchema,
  name: z.string().trim().min(1, "name is required"),
  artistName: z.string().trim().min(1).nullable().optional(),
  imageUrl: z.url().nullable().optional(),
  url: z.url().nullable().optional(),
  mbid: z.string().nullable().optional(),
});

export const playlistTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artistName: z.string(),
  imageUrl: z.string().nullable(),
  url: z.string().nullable(),
  mbid: z.string().nullable(),
  position: z.number(),
  createdAt: z.string(),
});

export const playlistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  trackCount: z.number(),
  isPublic: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const playlistDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tracks: z.array(playlistTrackSchema),
});

export const createPlaylistSchema = z.object({
  name: z.string().trim().min(1, "playlist name is required"),
  description: z.string().trim().max(500).nullable().optional(),
});

export const updatePlaylistSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    "nothing to update",
  );

export const addPlaylistTrackSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  artistName: z.string().trim().min(1, "artist name is required"),
  imageUrl: z.url().nullable().optional(),
  url: z.url().nullable().optional(),
  mbid: z.string().nullable().optional(),
});

export const historyEntrySchema = z.object({
  id: z.string(),
  kind: favoriteKindSchema,
  name: z.string(),
  artistName: z.string().nullable(),
  imageUrl: z.string().nullable(),
  url: z.string().nullable(),
  mbid: z.string().nullable(),
  key: z.string(),
  createdAt: z.string(),
});

export const logHistorySchema = z.object({
  kind: favoriteKindSchema,
  name: z.string().trim().min(1, "name is required"),
  artistName: z.string().trim().min(1).nullable().optional(),
  imageUrl: z.url().nullable().optional(),
  url: z.url().nullable().optional(),
  mbid: z.string().nullable().optional(),
});

export const sharePlaylistResponseSchema = z.object({
  token: z.string(),
  url: z.string(),
  isPublic: z.boolean(),
});

export const sharedPlaylistSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  tracks: z.array(playlistTrackSchema),
});

export type Favorite = z.infer<typeof favoriteSchema>;
export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
export type Playlist = z.infer<typeof playlistSchema>;
export type PlaylistDetail = z.infer<typeof playlistDetailSchema>;
export type PlaylistTrack = z.infer<typeof playlistTrackSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
export type AddPlaylistTrackInput = z.infer<typeof addPlaylistTrackSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export type LogHistoryInput = z.infer<typeof logHistorySchema>;
export type SharePlaylistResponse = z.infer<typeof sharePlaylistResponseSchema>;
export type SharedPlaylist = z.infer<typeof sharedPlaylistSchema>;