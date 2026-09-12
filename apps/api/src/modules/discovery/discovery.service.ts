import { lastFmRequest } from "../../integrations/lastfm/lastfm.client.ts";
import { getLastFmImageUrl } from "../../integrations/lastfm/lastfm.utils.ts";
import { getITunesTrackData, getArtistImageFromITunes } from "../../integrations/itunes/itunes.client.ts";

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

export async function getPopularTracks() {
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
    })
  );
}

export async function getPopularArtists() {
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
