export {
  musicSchema,
  musicSearchResponseSchema,
  musicSearchQuerySchema,
  trackDetailSchema,
} from "./schemas/music.schema.ts";

export type {
  Music,
  MusicSearchResponse,
  MusicSearchQuery,
  TrackDetail,
} from "./schemas/music.schema.ts";

export {
  artistSchema,
  artistSearchSchema,
  artistSearchResultSchema,
  artistTracksQuerySchema,
  artistTracksResponseSchema,
  type Artist,
  type ArtistSearchResult,
  type ArtistTracksQuery,
  type ArtistTracksResponse,
} from "./schemas/artist.schema.ts";

export {
  registerSchema,
  loginSchema,
  userSchema,
  type RegisterInput,
  type LoginInput,
  type User,
} from "./schemas/auth.schema.ts";

export {
  favoriteKindSchema,
  favoriteKey,
  favoriteSchema,
  addFavoriteSchema,
  playlistSchema,
  playlistDetailSchema,
  playlistTrackSchema,
  createPlaylistSchema,
  updatePlaylistSchema,
  addPlaylistTrackSchema,
  historyEntrySchema,
  logHistorySchema,
  sharePlaylistResponseSchema,
  sharedPlaylistSchema,
  type Favorite,
  type FavoriteKind,
  type AddFavoriteInput,
  type Playlist,
  type PlaylistDetail,
  type PlaylistTrack,
  type CreatePlaylistInput,
  type UpdatePlaylistInput,
  type AddPlaylistTrackInput,
  type HistoryEntry,
  type LogHistoryInput,
  type SharePlaylistResponse,
  type SharedPlaylist,
} from "./schemas/library.schema.ts";

export {
  recommendationSchema,
  forYouSourceSchema,
  forYouResponseSchema,
  similarToResponseSchema,
  aiRerankResultSchema,
  moodRequestSchema,
  moodResponseSchema,
  playlistDraftRequestSchema,
  playlistDraftResponseSchema,
  type Recommendation,
  type ForYouSource,
  type ForYouResponse,
  type SimilarToResponse,
  type AiRerankResult,
  type MoodInput,
  type MoodResponse,
  type PlaylistDraftRequest,
  type PlaylistDraftResponse,
} from "./schemas/recommendation.schema.ts";

export {
  followSchema,
  addFollowSchema,
  notificationSchema,
  type Follow,
  type AddFollowInput,
  type Notification,
} from "./schemas/follow.schema.ts";

export {
  GENRES,
  isKnownGenre,
  type Genre,
} from "./lib/genres.ts";

export {
  genreTracksQuerySchema,
  genreTracksResponseSchema,
  type GenreTracksQuery,
  type GenreTracksResponse,
} from "./schemas/genre.schema.ts";

export {
  statsSchema,
  topItemSchema,
  type Stats,
  type TopItem,
} from "./schemas/stats.schema.ts";