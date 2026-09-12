import { artistSearchResultSchema, musicSchema } from "@sonora/shared";
import { lastFmRequest } from "../../integrations/lastfm/lastfm.client.ts";
import { getLastFmImageUrl } from "../../integrations/lastfm/lastfm.utils.ts";
import {
  getArtistImageFromITunes,
  getITunesTrackData,
} from "../../integrations/itunes/itunes.client.ts";

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

export async function getGenreTracks(
  tag: string,
  options: { page?: number; limit?: number } = {},
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

export async function getGenreArtists(tag: string) {
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