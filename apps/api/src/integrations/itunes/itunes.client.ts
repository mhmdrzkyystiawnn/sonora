type ITunesSearchResponse = {
  results: Array<{
    artworkUrl100?: string;
    artistName?: string;
    previewUrl?: string;
  }>;
};

export type ITunesTrackData = {
  imageUrl?: string;
  previewUrl?: string;
};

const artistImageCache = new Map<
  string,
  { url?: string; expiresAt: number }
>();

const trackDataCache = new Map<
  string,
  { data: ITunesTrackData; expiresAt: number }
>();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MISS_TTL_MS = 60 * 60 * 1000;

let activeFetches = 0;
const fetchQueue: Array<() => void> = [];
const MAX_CONCURRENT_ITUNES = 5;

async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (activeFetches >= MAX_CONCURRENT_ITUNES) {
    await new Promise<void>((resolve) => fetchQueue.push(resolve));
  }

  activeFetches += 1;

  try {
    return await fn();
  } finally {
    activeFetches -= 1;
    fetchQueue.shift()?.();
  }
}

export async function getITunesTrackData(
  artist: string,
  track: string,
): Promise<ITunesTrackData> {
  const key = `${artist}::${track}`.toLowerCase();

  const cached = trackDataCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const term = encodeURIComponent(`${artist} ${track}`);

    const data = await withConcurrencyLimit(async () => {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`,
      );

      if (!response.ok) {
        throw new Error(`itunes api error: ${response.status}`);
      }

      const json: ITunesSearchResponse = await response.json();
      return json;
    });

    const result = data.results[0];

    const resultData: ITunesTrackData = {
      imageUrl: result?.artworkUrl100?.replace("100x100", "600x600"),
      previewUrl: result?.previewUrl,
    };

    trackDataCache.set(key, {
      data: resultData,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return resultData;
  } catch {
    trackDataCache.set(key, {
      data: {},
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return {};
  }
}

export async function getCoverArtFromITunes(
  artist: string,
  track: string,
): Promise<string | undefined> {
  const { imageUrl } = await getITunesTrackData(artist, track);

  return imageUrl;
}

export async function getArtistImageFromITunes(
  artist: string,
): Promise<string | undefined> {
  const key = `artist::${artist}`.toLowerCase();

  const cached = artistImageCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    const term = encodeURIComponent(artist);

    // Try musicArtist entity first for more accurate artist image
    const response = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=musicArtist&limit=1`,
    );

    if (!response.ok) {
      throw new Error(`itunes api error: ${response.status}`);
    }

    const data: ITunesSearchResponse = await response.json();

    let artwork = data.results[0]?.artworkUrl100;

    // If no artist-specific artwork, fallback to searching for songs and getting album artwork
    if (!artwork) {
      const songResponse = await fetch(
        `https://itunes.apple.com/search?term=${term}&entity=song&limit=1`,
      );

      if (songResponse.ok) {
        const songData: ITunesSearchResponse = await songResponse.json();
        artwork = songData.results[0]?.artworkUrl100;
      }
    }

    const url = artwork?.replace("100x100", "600x600");

    artistImageCache.set(key, {
      url,
      expiresAt: Date.now() + (url ? CACHE_TTL_MS : MISS_TTL_MS),
    });

    return url;
  } catch {
    artistImageCache.set(key, {
      url: undefined,
      expiresAt: Date.now() + MISS_TTL_MS,
    });

    return undefined;
  }
}