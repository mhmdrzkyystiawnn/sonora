import { artistSchema, artistSearchResultSchema, musicSchema } from "../../shared/index.js";
import { lastFmRequest } from "../../integrations/lastfm/lastfm.client.ts";
import { getLastFmImageUrl } from "../../integrations/lastfm/lastfm.utils.ts";
import { getCoverArtFromITunes, getArtistImageFromITunes } from "../../integrations/itunes/itunes.client.ts";
import { NotFoundError } from "../../lib/api-error.ts";

type LastFmArtist = {
  name: string;
  url: string;
  image?: Array<{ "#text": string; size: string }>;
  listeners?: string;
  playcount?: string;
};

type LastFmArtistSearchResponse = {
  results: {
    artistmatches: {
      artist: LastFmArtist[];
    };
  };
};

type LastFmArtistInfoResponse = {
  artist: {
    name: string;
    url: string;
    image?: Array<{ "#text": string; size: string }>;
    stats?: { listeners?: string; playcount?: string };
    bio?: { summary?: string; content?: string };
    tags?: { tag?: Array<{ name: string; url: string }> };
  };
};

type LastFmTopTracksResponse = {
  toptracks: {
    track: Array<{
      name: string;
      url: string;
      playcount?: string;
      artist: { name: string; url: string };
      image?: Array<{ "#text": string; size: string }>;
    }>;
    "@attr"?: { page?: string; perPage?: string; total?: string; totalPages?: string };
  };
};

function stripHtml(html?: string) {
  if (!html) return undefined;
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function searchArtist(query: string) {
  const response = await lastFmRequest<LastFmArtistSearchResponse>({
    method: "artist.search",
    artist: query,
  });

  const artists = response.results.artistmatches.artist
    .sort((a, b) => Number(b.listeners ?? 0) - Number(a.listeners ?? 0))
    .slice(0, 5);

  const results = [];
  for (const artist of artists) {
    const lastFmImage = getLastFmImageUrl(artist.image);
    let imageUrl = lastFmImage;
    if (!imageUrl) {
      imageUrl = await getArtistImageFromITunes(artist.name);
    }
    results.push(artistSearchResultSchema.parse({
      name: artist.name,
      url: artist.url,
      imageUrl,
      listeners: artist.listeners,
      playcount: artist.playcount,
    }));
  }
  return results;
}

export async function getArtist(artist: string) {
  const response = await lastFmRequest<LastFmArtistInfoResponse>({
    method: "artist.getinfo",
    artist,
  });

  if (!response.artist) throw new NotFoundError(`artist "${artist}" not found`);

  const data = response.artist;
  const lastFmImage = getLastFmImageUrl(data.image);
  let imageUrl = lastFmImage;
  if (!imageUrl) {
    imageUrl = await getArtistImageFromITunes(data.name);
  }

  return artistSchema.parse({
    name: data.name,
    url: data.url,
    imageUrl,
    listeners: data.stats?.listeners,
    playcount: data.stats?.playcount,
    bio: {
      summary: stripHtml(data.bio?.summary),
      content: stripHtml(data.bio?.content),
    },
    tags: data.tags?.tag?.map((tag) => ({ name: tag.name, url: tag.url })) ?? [],
  });
}

export async function getArtistTopTracks(artist: string, query: { page: number; limit: number }) {
  const response = await lastFmRequest<LastFmTopTracksResponse>({
    method: "artist.gettoptracks",
    artist,
    page: String(query.page),
    limit: String(query.limit),
  });

  if (!response.toptracks) throw new NotFoundError(`artist "${artist}" not found`);

  const tracks = response.toptracks.track;
  const attr = response.toptracks["@attr"];
  const total = attr?.total ? Number(attr.total) : tracks.length;
  const totalPages = attr?.totalPages ? Number(attr.totalPages) : 1;

  const data = [];
  for (const track of tracks) {
    const lastFmImage = getLastFmImageUrl(track.image);
    let imageUrl = lastFmImage;
    if (!imageUrl) {
      imageUrl = await getCoverArtFromITunes(track.artist.name, track.name);
    }
    data.push(musicSchema.parse({
      title: track.name,
      artist: track.artist.name,
      url: track.url,
      playCount: track.playcount,
      imageUrl,
    }));
  }
  return { total, totalPages, data };
}

type LastFmSimilarArtistsResponse = {
  similarartists: {
    artist: Array<{
      name: string;
      url: string;
      image?: Array<{ "#text": string; size: string }>;
    }>;
  };
};

export async function getSimilarArtists(artist: string) {
  const response = await lastFmRequest<LastFmSimilarArtistsResponse>({
    method: "artist.getsimilar",
    artist,
    limit: "10",
  });

  if (!response.similarartists) throw new NotFoundError(`artist "${artist}" not found`);

  const similar = response.similarartists.artist || [];

  const results = [];
  for (const a of similar) {
    const lastFmImage = getLastFmImageUrl(a.image);
    let imageUrl = lastFmImage;
    if (!imageUrl) {
      imageUrl = await getArtistImageFromITunes(a.name);
    }
    results.push(artistSearchResultSchema.parse({
      name: a.name,
      url: a.url,
      imageUrl,
    }));
  }
  return results;
}
