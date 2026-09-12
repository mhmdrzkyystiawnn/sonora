import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Drizzle table definitions
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    artistName: text("artist_name"),
    imageUrl: text("image_url"),
    url: text("url"),
    mbid: text("mbid"),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userKeyUnique: unique("favorites_user_key_unique").on(table.userId, table.key),
  }),
);

export const searchHistory = pgTable(
  "search_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    artistName: text("artist_name"),
    imageUrl: text("image_url"),
    url: text("url"),
    mbid: text("mbid"),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userKeyUnique: unique("search_history_user_key_unique").on(table.userId, table.key),
  }),
);

export const playlists = pgTable("playlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  shareToken: text("share_token"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const playlistTracks = pgTable(
  "playlist_tracks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playlistId: uuid("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    artistName: text("artist_name").notNull(),
    imageUrl: text("image_url"),
    url: text("url"),
    mbid: text("mbid"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    playlistTrackUnique: unique("playlist_tracks_playlist_name_artist_unique").on(
      table.playlistId,
      table.name,
      table.artistName,
    ),
  }),
);

export const recommendationCache = pgTable(
  "recommendation_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userKeyUnique: unique("recommendation_cache_user_key_unique").on(
      table.userId,
      table.key,
    ),
  }),
);

export const artistFollows = pgTable(
  "artist_follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url"),
    imageUrl: text("image_url"),
    mbid: text("mbid"),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userKeyUnique: unique("artist_follows_user_key_unique").on(
      table.userId,
      table.key,
    ),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    dedupeKey: text("dedupe_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userDedupeUnique: unique("notifications_user_dedupe_unique").on(
      table.userId,
      table.dedupeKey,
    ),
  }),
);

// TypeScript interfaces for database rows (camelCase, matching Drizzle's $inferSelect output)
export interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteRow {
  id: string;
  userId: string;
  kind: string;
  name: string;
  artistName: string | null;
  imageUrl: string | null;
  url: string | null;
  mbid: string | null;
  key: string;
  createdAt: Date;
}

export interface HistoryRow {
  id: string;
  userId: string;
  kind: string;
  name: string;
  artistName: string | null;
  imageUrl: string | null;
  url: string | null;
  mbid: string | null;
  key: string;
  createdAt: Date;
}

export interface PlaylistRow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  trackCount?: number;
}

export interface PlaylistTrackRow {
  id: string;
  playlistId: string;
  name: string;
  artistName: string;
  imageUrl: string | null;
  url: string | null;
  mbid: string | null;
  position: number;
  createdAt: Date;
}

export interface ArtistFollowRow {
  id: string;
  userId: string;
  name: string;
  url: string | null;
  imageUrl: string | null;
  mbid: string | null;
  key: string;
  createdAt: Date;
}

export interface NotificationRow {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  dedupeKey: string | null;
  createdAt: Date;
}

export interface RecommendationCacheRow {
  id: string;
  userId: string;
  key: string;
  payload: unknown;
  createdAt: Date;
}

export interface DiscoveryCacheRow {
  id: string;
  cacheKey: string;
  payload: unknown;
  createdAt: Date;
}

export interface MusicCacheRow {
  id: string;
  cacheKey: string;
  payload: unknown;
  createdAt: Date;
}

export interface GenreCacheRow {
  id: string;
  cacheKey: string;
  payload: unknown;
  createdAt: Date;
}
