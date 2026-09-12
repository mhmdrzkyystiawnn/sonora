import { musicSchema, artistSearchResultSchema } from "../../shared/index.js";
import { db } from "../../db/client.ts";
import { lastFmRequest } from "../../integrations/lastfm/lastfm.client.ts";
import { getLastFmImageUrl } from "../../integrations/lastfm/lastfm.utils.ts";
import {
  getArtistImageFromITunes,
  getITunesTrackData,
} from "../../integrations/itunes/itunes.client.ts";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type LastFmGenreTracksResponse = {
  tracks: {
    track: Array<{
      name: string;
      url: string;
      playcount?: string;
      artist: {
        name: string;
        url: string;
      };
      image?: Array<{
        "#text": string;
        size: string;
      }>;
    }>;
    "@attr"?: {
      page?: string;
      perPage?: string;
      total?: string;
      totalPages?: string;
    };
  };
};

type LastFmGenreArtistsResponse = {
  topartists: {
    artist: Array<{
      name: string;
      url: string;
      playcount?: string;
      listeners?: string;
      image?: Array<{
        "#text": string;
        size: string;
      }>;
    }>;
  };
};

type GenreCacheRow = {
  id: string;
  cache_key: string;
  payload: unknown;
  created_at: Date;
};

async function getGenreCached<T>(cacheKey: string): Promise<T | null> {
  const rows = await db.query<GenreCacheRow>(
    "SELECT id, cache_key, payload, created_at FROM genre_cache WHERE cache_key = $1 AND created_at > $2 LIMIT 1",
    [cacheKey, new Date(Date.now() - CACHE_TTL_MS)],
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0].payload as T;
}

async function setGenreCache(
  cacheKey: string,
  payload: unknown,
): Promise<void> {
  await db.execute(
    "INSERT INTO genre_cache (cache_key, payload, created_at) VALUES ($1, $2, now()) ON CONFLICT (cache_key) DO UPDATE SET payload = $2, created_at = now()",
    [cacheKey, JSON.stringify(payload)],
  );
}

async function fetchGenreTracksFromApi(
  tag: string,
  options: { page?: number; limit?: number },
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;

  const response = await lastFmRequest<LastFmGenreTracksResponse>({
    method: "tag.gettoptracks",
    tag,
    limit: String(limit),
    page: String(page),
  });

  const tracks = response.tracks?.track || [];
  const attr = response.tracks?.["@attr"];
  const total = attr?.total ? Number(attr.total) : tracks.length;
  const totalPages = attr?.totalPages ? Number(attr.totalPages) : 1;

  const data = await Promise.all(
    tracks.map(async (track) => {
      const lastFmImage = getLastFmImageUrl(track.image);
      const itunes = await getITunesTrackData(
        track.artist.name,
        track.name,
      );

      return musicSchema.parse({
        title: track.name,
        artist: track.artist.name,
        url: track.url,
        playCount: track.playcount,
        imageUrl: lastFmImage ?? itunes.imageUrl,
        previewUrl: itunes.previewUrl,
      });
    }),
  );

  return { data, page, limit, total, totalPages };
}

async function fetchGenreArtistsFromApi(tag: string) {
  const response = await lastFmRequest<LastFmGenreArtistsResponse>({
    method: "tag.gettopartists",
    tag,
    limit: "20",
  });

  const artists = response.topartists?.artist || [];

  return Promise.all(
    artists.map(async (artist) => {
      const lastFmImage = getLastFmImageUrl(artist.image);
      const imageUrl =
        lastFmImage ??
        (await getArtistImageFromITunes(artist.name));

      return artistSearchResultSchema.parse({
        name: artist.name,
        url: artist.url,
        imageUrl,
        listeners: artist.listeners,
        playcount: artist.playcount,
      });
    }),
  );
}

export async function getGenreTracks(
  tag: string,
  options: { page?: number; limit?: number } = {},
) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const cacheKey = `genre:${tag}:tracks:${page}:${limit}`;

  const cached = await getGenreCached<
    Awaited<ReturnType<typeof fetchGenreTracksFromApi>>
  >(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await fetchGenreTracksFromApi(tag, options);
  await setGenreCache(cacheKey, result);

  return result;
}

export async function getGenreArtists(tag: string) {
  const cacheKey = `genre:${tag}:artists`;

  const cached = await getGenreCached<
    Awaited<ReturnType<typeof fetchGenreArtistsFromApi>>
  >(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await fetchGenreArtistsFromApi(tag);
  await setGenreCache(cacheKey, result);

  return result;
}
