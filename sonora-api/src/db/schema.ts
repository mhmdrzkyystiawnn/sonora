// TypeScript types for database rows (no Drizzle ORM dependency)
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface FavoriteRow {
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

export interface HistoryRow {
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

export interface PlaylistRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  share_token: string | null;
  created_at: Date;
  updated_at: Date;
  track_count?: number;
}

export interface PlaylistTrackRow {
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

export interface ArtistFollowRow {
  id: string;
  user_id: string;
  name: string;
  url: string | null;
  image_url: string | null;
  mbid: string | null;
  key: string;
  created_at: Date;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  dedupe_key: string | null;
  created_at: Date;
}

export interface RecommendationCacheRow {
  id: string;
  user_id: string;
  key: string;
  payload: unknown;
  created_at: Date;
}

export interface DiscoveryCacheRow {
  id: string;
  cache_key: string;
  payload: unknown;
  created_at: Date;
}

export interface MusicCacheRow {
  id: string;
  cache_key: string;
  payload: unknown;
  created_at: Date;
}

export interface GenreCacheRow {
  id: string;
  cache_key: string;
  payload: unknown;
  created_at: Date;
}
