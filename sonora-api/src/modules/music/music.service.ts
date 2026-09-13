import { musicSchema, trackDetailSchema } from "../../shared/index.js";
import { lastFmRequest } from "../../integrations/lastfm/lastfm.client.ts";
import { getLastFmImageUrl } from "../../integrations/lastfm/lastfm.utils.ts";
import { getITunesTrackData } from "../../integrations/itunes/itunes.client.ts";
import { NotFoundError } from "../../lib/api-error.ts";
import { db } from "../../db/client.ts";

type LastFmTrack = {
  name: string;
  artist: string;
  url: string;
  image?: Array<{
    "#text": string;
    size: string;
  }>;
};

type LastFmTrackSearchResponse = {
  results: {
    trackmatches: {
      track: LastFmTrack[];
    };
  };
};

interface MusicCacheRow {
  payload: Record<string, unknown>;
  created_at: Date;
}

interface TrackDetailCacheRow {
  payload: Record<string, unknown>;
  created_at: Date;
}

function rowToMusic(row: MusicCacheRow) {
  return musicSchema.parse(row.payload);
}

function rowToTrackDetail(row: TrackDetailCacheRow) {
  return trackDetailSchema.parse(row.payload);
}

export async function searchMusic(query: string) {
  const cacheKey = `music:search:${query.toLowerCase()}`;

  const cached = await db.query<MusicCacheRow>(
    "SELECT payload, created_at FROM music_cache WHERE cache_key = $1 LIMIT 1",
    [cacheKey],
  );

  if (cached.length > 0) {
    return cached.map(rowToMusic);
  }

  const response =
    await lastFmRequest<LastFmTrackSearchResponse>({
      method: "track.search",
      track: query,
      limit: "10",
    });

  const tracks = response.results.trackmatches.track;

  // Sequential to avoid "too many subrequests"
  const enriched: ReturnType<typeof rowToMusic>[] = [];
  for (const track of tracks) {
    const lastFmImage = getLastFmImageUrl(track.image);
    
    let itunes: { imageUrl?: string; previewUrl?: string } = {};
    if (!lastFmImage) {
      itunes = await getITunesTrackData(track.artist, track.name);
    }

    enriched.push(musicSchema.parse({
      title: track.name,
      artist: track.artist,
      url: track.url,
      imageUrl: lastFmImage ?? itunes.imageUrl,
      previewUrl: itunes.previewUrl,
    }));
  }

  await db.execute(
    "INSERT INTO music_cache (cache_key, payload) VALUES ($1, $2) ON CONFLICT (cache_key) DO UPDATE SET payload = EXCLUDED.payload, created_at = NOW()",
    [cacheKey, JSON.stringify(enriched)],
  );

  return enriched;
}

type LastFmSimilarTracksResponse = {
  similartracks: {
    track: Array<{
      name: string;
      url: string;
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

export async function getSimilarTracks(artist: string, track: string) {
  const cacheKey = `music:similar:${artist.toLowerCase()}:${track.toLowerCase()}`;

  const cached = await db.query<MusicCacheRow>(
    "SELECT payload, created_at FROM music_cache WHERE cache_key = $1 LIMIT 1",
    [cacheKey],
  );

  if (cached.length > 0) {
    return cached.map(rowToMusic);
  }

  const response = await lastFmRequest<LastFmSimilarTracksResponse>({
    method: "track.getsimilar",
    artist,
    track,
    limit: "20",
  });

  const tracks = response.similartracks?.track || [];

  // Sequential to avoid "too many subrequests"
  const enriched: ReturnType<typeof rowToMusic>[] = [];
  for (const t of tracks) {
    const lastFmImage = getLastFmImageUrl(t.image);
    
    let itunes: { imageUrl?: string; previewUrl?: string } = {};
    if (!lastFmImage) {
      itunes = await getITunesTrackData(t.artist.name, t.name);
    }

    enriched.push(musicSchema.parse({
      title: t.name,
      artist: t.artist.name,
      url: t.url,
      imageUrl: lastFmImage ?? itunes.imageUrl,
      previewUrl: itunes.previewUrl,
    }));
  }

  await db.execute(
    "INSERT INTO music_cache (cache_key, payload) VALUES ($1, $2) ON CONFLICT (cache_key) DO UPDATE SET payload = EXCLUDED.payload, created_at = NOW()",
    [cacheKey, JSON.stringify(enriched)],
  );

  return enriched;
}

type LastFmTrackInfoResponse = {
  track?: {
    name: string;
    url: string;
    duration?: string;
    listeners?: string;
    playcount?: string;
    album?: {
      title?: string;
      image?: Array<{
        "#text": string;
        size: string;
      }>;
    };
    toptags?: {
      tag?: Array<{
        name: string;
        url: string;
      }>;
    };
    wiki?: {
      summary?: string;
    };
  };
};

function stripHtml(html?: string) {
  if (!html) return undefined;

  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getTrack(artist: string, track: string) {
  const cacheKey = `music:track:${artist.toLowerCase()}:${track.toLowerCase()}`;

  const cached = await db.query<TrackDetailCacheRow>(
    "SELECT payload, created_at FROM music_cache WHERE cache_key = $1 LIMIT 1",
    [cacheKey],
  );

  if (cached.length > 0) {
    return rowToTrackDetail(cached[0]);
  }

  const response =
    await lastFmRequest<LastFmTrackInfoResponse>({
      method: "track.getinfo",
      artist,
      track,
    });

  if (!response.track) {
    throw new NotFoundError(
      `track "${artist} - ${track}" not found`,
    );
  }

  const data = response.track;

  const lastFmImage = getLastFmImageUrl(data.album?.image);

  let itunes: { imageUrl?: string; previewUrl?: string } = {};
  if (!lastFmImage) {
    itunes = await getITunesTrackData(artist, track);
  }

  const result = trackDetailSchema.parse({
    title: data.name,
    artist,
    url: data.url,
    playCount: data.playcount,
    imageUrl: lastFmImage ?? itunes.imageUrl,
    previewUrl: itunes.previewUrl,
    album: data.album?.title,
    duration: data.duration,
    listeners: data.listeners,
    summary: stripHtml(data.wiki?.summary),
    tags:
      data.toptags?.tag?.map((tag) => ({
        name: tag.name,
        url: tag.url,
      })) ?? [],
  });

  await db.execute(
    "INSERT INTO music_cache (cache_key, payload) VALUES ($1, $2) ON CONFLICT (cache_key) DO UPDATE SET payload = EXCLUDED.payload, created_at = NOW()",
    [cacheKey, JSON.stringify(result)],
  );

  return result;
}
