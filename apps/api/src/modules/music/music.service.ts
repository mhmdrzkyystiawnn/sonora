import { musicSchema, trackDetailSchema } from "@sonora/shared";
import { lastFmRequest } from "../../integrations/lastfm/lastfm.client.ts";
import { getLastFmImageUrl } from "../../integrations/lastfm/lastfm.utils.ts";
import { getITunesTrackData } from "../../integrations/itunes/itunes.client.ts";
import { NotFoundError } from "../../lib/api-error.ts";

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

export async function searchMusic(query: string) {
  const response =
    await lastFmRequest<LastFmTrackSearchResponse>({
      method: "track.search",
      track: query,
    });

  const tracks = response.results.trackmatches.track;

  const enriched = await Promise.all(
    tracks.map(async (track) => {
      const lastFmImage = getLastFmImageUrl(track.image);

      const itunes = await getITunesTrackData(
        track.artist,
        track.name,
      );

      return musicSchema.parse({
        title: track.name,
        artist: track.artist,
        url: track.url,
        imageUrl: lastFmImage ?? itunes.imageUrl,
        previewUrl: itunes.previewUrl,
      });
    }),
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
  const response = await lastFmRequest<LastFmSimilarTracksResponse>({
    method: "track.getsimilar",
    artist,
    track,
    limit: "100",
  });

  const tracks = response.similartracks?.track || [];

  const enriched = await Promise.all(
    tracks.map(async (t) => {
      const lastFmImage = getLastFmImageUrl(t.image);

      const itunes = await getITunesTrackData(
        t.artist.name,
        t.name,
      );

      return musicSchema.parse({
        title: t.name,
        artist: t.artist.name,
        url: t.url,
        imageUrl: lastFmImage ?? itunes.imageUrl,
        previewUrl: itunes.previewUrl,
      });
    }),
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

  const itunes = await getITunesTrackData(artist, track);

  return trackDetailSchema.parse({
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
}