import type {
  ForYouResponse,
  MoodResponse,
  Recommendation,
  SimilarToResponse,
} from "../../shared/index.js";
import { forYouResponseSchema, moodResponseSchema, recommendationSchema } from "../../shared/index.js";
import { db } from "../../db/client.ts";
import { getSimilarArtists } from "../artist/artist.service.ts";
import { getGenreTracks } from "../genre/genre.service.ts";
import { rerankCandidates, selectMoodTracks, generatePlaylistDraft } from "../../lib/ai-client.ts";
import {
  getCachedRecommendation,
  setCachedRecommendation,
} from "../../lib/recommendation-cache.ts";
import { lastFmRequest } from "../../integrations/lastfm/lastfm.client.ts";
import { getLastFmImageUrl } from "../../integrations/lastfm/lastfm.utils.ts";

const FOR_YOU_CACHE_KEY = "for-you";
const MAX_TASTE_ARTISTS = 3;
const MAX_CANDIDATES = 10;
const MAX_RECOMMENDATIONS = 8;
const MAX_MOOD_RESULTS = 10;

const MOOD_GENRES = ["rock", "jazz", "hip-hop"];

type Candidate = {
  name: string;
  url: string;
  imageUrl?: string;
  listeners?: string;
  playcount?: string;
  artistName?: string;
  previewUrl?: string;
  source: string;
};

function toRecommendation(
  candidate: Candidate,
  reason: string | null,
): Recommendation {
  return recommendationSchema.parse({
    name: candidate.name,
    url: candidate.url,
    imageUrl: candidate.imageUrl,
    listeners: candidate.listeners,
    playcount: candidate.playcount,
    artistName: candidate.artistName,
    previewUrl: candidate.previewUrl,
    reason,
  });
}

async function getUserTaste(userId: string): Promise<string[]> {
  const [historyRows, favoriteRows] = await Promise.all([
    db.query<{ kind: string; name: string; artist_name: string | null }>(
      `SELECT kind, name, artist_name FROM search_history WHERE user_id = $1`,
      [userId],
    ),
    db.query<{ kind: string; name: string; artist_name: string | null }>(
      `SELECT kind, name, artist_name FROM favorites WHERE user_id = $1`,
      [userId],
    ),
  ]);

  const counts = new Map<string, number>();

  function add(artist: string | null) {
    if (!artist) return;
    const key = artist.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  for (const row of historyRows) add(row.kind === "artist" ? row.name : row.artist_name);
  for (const row of favoriteRows) add(row.kind === "artist" ? row.name : row.artist_name);

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TASTE_ARTISTS)
    .map(([artist]) => artist);
}

async function collectCandidates(taste: string[]): Promise<Candidate[]> {
  const seedSet = new Set(taste.map((a) => a.toLowerCase()));
  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  for (const seed of taste) {
    try {
      const similar = await getSimilarArtists(seed);

      for (const artist of similar.slice(0, 5)) {
        const key = artist.name.toLowerCase();
        if (seedSet.has(key) || seen.has(key)) continue;
        seen.add(key);
        candidates.push({
          name: artist.name,
          url: artist.url,
          imageUrl: artist.imageUrl,
          listeners: artist.listeners,
          playcount: artist.playcount,
          source: seed,
        });
        if (candidates.length >= MAX_CANDIDATES) break;
      }
    } catch {}
    if (candidates.length >= MAX_CANDIDATES) break;
  }

  return candidates;
}

export async function getForYou(userId: string): Promise<ForYouResponse> {
  const cached = await getCachedRecommendation<ForYouResponse>(userId, FOR_YOU_CACHE_KEY);
  if (cached) return cached;

  const taste = await getUserTaste(userId);
  if (taste.length === 0) return { data: [], source: "empty" };

  const candidates = await collectCandidates(taste);
  if (candidates.length === 0) return { data: [], source: "empty" };

  try {
    const reranked = await rerankCandidates({
      taste,
      candidates: candidates.map((c) => ({ name: c.name, source: c.source })),
    });

    const byName = new Map(candidates.map((c) => [c.name.toLowerCase(), c]));

    const data = reranked
      .map((item) => {
        const candidate = byName.get(item.name.toLowerCase());
        return candidate ? toRecommendation(candidate, item.reason) : null;
      })
      .filter((item): item is Recommendation => item !== null)
      .slice(0, MAX_RECOMMENDATIONS);

    if (data.length > 0) {
      const response = forYouResponseSchema.parse({ data, source: "ai" });
      await setCachedRecommendation(userId, FOR_YOU_CACHE_KEY, response);
      return response;
    }
  } catch {}

  const response = forYouResponseSchema.parse({
    data: candidates.slice(0, MAX_RECOMMENDATIONS).map((c) => toRecommendation(c, null)),
    source: "lastfm",
  });
  await setCachedRecommendation(userId, FOR_YOU_CACHE_KEY, response);
  return response;
}

export async function getSimilarTo(artist: string): Promise<SimilarToResponse> {
  const similar = await getSimilarArtists(artist);
  const data = similar.map((item) =>
    toRecommendation(
      { name: item.name, url: item.url, imageUrl: item.imageUrl, listeners: item.listeners, playcount: item.playcount, source: artist },
      null,
    ),
  );
  return { artist, data };
}

type LastFmArtistTopTracksResponse = {
  toptracks: {
    track: Array<{
      name: string;
      url: string;
      artist: { name: string };
      image?: Array<{ "#text": string; size: string }>;
    }>;
  };
};

type MoodCandidate = {
  name: string;
  artistName: string;
  url: string;
  imageUrl?: string;
  previewUrl?: string;
  source: string;
};

async function getArtistTopTrackCandidates(artist: string, limit: number): Promise<MoodCandidate[]> {
  const response = await lastFmRequest<LastFmArtistTopTracksResponse>({
    method: "artist.gettoptracks",
    artist,
    limit: String(limit),
  });
  const tracks = response.toptracks?.track || [];
  return tracks.map((track) => ({
    name: track.name,
    artistName: track.artist.name,
    url: track.url,
    imageUrl: getLastFmImageUrl(track.image),
    source: artist,
  }));
}

function moodCacheKey(mood: string): string {
  const normalized = mood.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return `mood:${hash.toString(16)}`;
}

export async function getMoodPlaylist(userId: string, mood: string): Promise<MoodResponse> {
  const cacheKey = moodCacheKey(mood);
  const cached = await getCachedRecommendation<MoodResponse>(userId, cacheKey);
  if (cached) return cached;

  const taste = await getUserTaste(userId);
  const genreResults = await Promise.all(
    MOOD_GENRES.map(async (tag) => {
      const result = await getGenreTracks(tag);
      return result.data;
    }),
  );

  const artistResults =
    taste.length > 0
      ? await Promise.all(taste.slice(0, 2).map((artist) => getArtistTopTrackCandidates(artist, 3)))
      : [];

  const seen = new Set<string>();
  const candidates: MoodCandidate[] = [];

  function add(name: string, artistName: string, url: string, imageUrl?: string, previewUrl?: string, source?: string) {
    const key = `${name.toLowerCase()}|${artistName.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ name, artistName, url, imageUrl, previewUrl, source: source ?? "genre" });
  }

  for (const tracks of genreResults) {
    for (const track of tracks) {
      add(track.title, track.artist, track.url, track.imageUrl, track.previewUrl);
    }
  }

  for (const tracks of artistResults) {
    for (const track of tracks) {
      add(track.name, track.artistName, track.url, track.imageUrl, track.previewUrl, "taste");
    }
  }

  const fallback: MoodResponse = moodResponseSchema.parse({
    mood,
    source: "lastfm",
    data: candidates.slice(0, MAX_MOOD_RESULTS).map((c) =>
      toRecommendation({ name: c.name, url: c.url, imageUrl: c.imageUrl, previewUrl: c.previewUrl, artistName: c.artistName, source: c.source }, null),
    ),
  });

  try {
    const selected = await selectMoodTracks({
      mood,
      candidates: candidates.map((c) => ({ name: c.name, artistName: c.artistName, source: c.source })),
    });

    const byKey = new Map(candidates.map((c) => [`${c.name.toLowerCase()}|${c.artistName.toLowerCase()}`, c]));

    const data = selected
      .map((item) => {
        const candidate = byKey.get(`${item.name.toLowerCase()}|${item.artistName.toLowerCase()}`);
        return candidate
          ? toRecommendation({ name: candidate.name, url: candidate.url, imageUrl: candidate.imageUrl, previewUrl: candidate.previewUrl, artistName: candidate.artistName, source: candidate.source }, item.reason)
          : null;
      })
      .filter((item): item is Recommendation => item !== null)
      .slice(0, MAX_MOOD_RESULTS);

    if (data.length > 0) {
      const response = moodResponseSchema.parse({ mood, data, source: "ai" });
      await setCachedRecommendation(userId, cacheKey, response);
      return response;
    }
  } catch {}

  await setCachedRecommendation(userId, cacheKey, fallback);
  return fallback;
}

export async function getPlaylistDraft(prompt: string): Promise<{ name: string; description: string }> {
  return generatePlaylistDraft(prompt);
}
