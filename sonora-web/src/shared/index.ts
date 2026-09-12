export {
  musicSchema,
  musicSearchResponseSchema,
  musicSearchQuerySchema,
  trackDetailSchema,
} from "./schemas/music.schema";

export type {
  Music,
  MusicSearchResponse,
  MusicSearchQuery,
  TrackDetail,
} from "./schemas/music.schema";

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
} from "./schemas/artist.schema";

export {
  registerSchema,
  loginSchema,
  userSchema,
  type RegisterInput,
  type LoginInput,
  type User,
} from "./schemas/auth.schema";

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
} from "./schemas/library.schema";

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
} from "./schemas/recommendation.schema";

export {
  followSchema,
  addFollowSchema,
  notificationSchema,
  type Follow,
  type AddFollowInput,
  type Notification,
} from "./schemas/follow.schema";

export {
  GENRES,
  isKnownGenre,
  type Genre,
} from "./lib/genres";

export {
  genreTracksQuerySchema,
  genreTracksResponseSchema,
  type GenreTracksQuery,
  type GenreTracksResponse,
} from "./schemas/genre.schema";

export {
  statsSchema,
  topItemSchema,
  type Stats,
  type TopItem,
} from "./schemas/stats.schema";