import { db } from "../../db/client.ts";
import { lastFmRequest } from "../../integrations/lastfm/lastfm.client.ts";
import { getLastFmImageUrl } from "../../integrations/lastfm/lastfm.utils.ts";
import {
  getArtistImageFromITunes,
  getITunesTrackData,
} from "../../integrations/itunes/itunes.client.ts";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type LastFmTopTracksResponse = {
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
  };
};

type LastFmTopArtistsResponse = {
  artists: {
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

type CacheRow = {
  id: string;
  cache_key: string;
  payload: unknown;
  created_at: Date;
};

async function getCached<T>(cacheKey: string): Promise<T | null> {
  const rows = await db.query<CacheRow>(
    "SELECT * FROM discovery_cache WHERE cache_key = $1 AND created_at > $2 LIMIT 1",
    [cacheKey, new Date(Date.now() - CACHE_TTL_MS)],
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0].payload as T;
}

async function setCache(cacheKey: string, payload: unknown): Promise<void> {
  await db.execute(
    "INSERT INTO discovery_cache (cache_key, payload) VALUES ($1, $2) ON CONFLICT (cache_key) DO UPDATE SET payload = $2, created_at = NOW()",
    [cacheKey, JSON.stringify(payload)],
  );
}

async function fetchPopularTracks() {
  const response = await lastFmRequest<LastFmTopTracksResponse>({
    method: "chart.gettoptracks",
    limit: "10",
  });

  const tracks = response.tracks?.track || [];

  return Promise.all(
    tracks.map(async (track) => {
      const lastFmImage = getLastFmImageUrl(track.image);
      const itunes = await getITunesTrackData(track.artist.name, track.name);

      return {
        title: track.name,
        artist: track.artist.name,
        url: track.url,
        playcount: track.playcount,
        imageUrl: lastFmImage ?? itunes.imageUrl,
        previewUrl: itunes.previewUrl,
      };
    }),
  );
}

async function fetchPopularArtists() {
  const response = await lastFmRequest<LastFmTopArtistsResponse>({
    method: "chart.gettopartists",
    limit: "10",
  });

  const artists = response.artists?.artist || [];

  return Promise.all(
    artists.map(async (artist) => {
      const lastFmImage = getLastFmImageUrl(artist.image);

      const imageUrl =
        lastFmImage ??
        (await getArtistImageFromITunes(artist.name));

      return {
        name: artist.name,
        url: artist.url,
        imageUrl,
        listeners: artist.listeners,
        playcount: artist.playcount,
      };
    }),
  );
}

export async function getPopularTracks() {
  const cacheKey = "popular_tracks";

  const cached = await getCached<ReturnType<typeof fetchPopularTracks>>(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await fetchPopularTracks();
  await setCache(cacheKey, data);

  return data;
}

export async function getPopularArtists() {
  const cacheKey = "popular_artists";

  const cached = await getCached<ReturnType<typeof fetchPopularArtists>>(
    cacheKey,
  );
  if (cached) {
    return cached;
  }

  const data = await fetchPopularArtists();
  await setCache(cacheKey, data);

  return data;
}
