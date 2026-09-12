import { db } from "../db/client.ts";
import { artistFollows, notifications } from "../db/schema.ts";
import { lastFmRequest } from "../integrations/lastfm/lastfm.client.ts";

const RELEASE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

type LastFmTopAlbumsResponse = {
  topalbums?: {
    album?: Array<{
      name: string;
      releasedate?: string;
    }>;
  };
};

function parseReleaseDate(raw?: string): Date | null {
  if (!raw) {
    return null;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  // last.fm sometimes returns a 1 Jan 1970 placeholder for unknown dates
  if (date.getFullYear() <= 1970) {
    return null;
  }

  return date;
}

export async function checkNewReleases(): Promise<number> {
  const follows = await db.select().from(artistFollows);
  const artists = [...new Set(follows.map((f) => f.name))];

  let created = 0;

  for (const artist of artists) {
    try {
      const response = await lastFmRequest<LastFmTopAlbumsResponse>({
        method: "artist.gettopalbums",
        artist,
        limit: "1",
      });

      const album = response.topalbums?.album?.[0];
      const released = parseReleaseDate(album?.releasedate);

      if (!album || !released) {
        continue;
      }

      if (Date.now() - released.getTime() > RELEASE_WINDOW_MS) {
        continue;
      }

      const followers = follows.filter(
        (f) => f.name.toLowerCase() === artist.toLowerCase(),
      );
      const dedupeKey = `release:${artist.toLowerCase()}:${album.name.toLowerCase()}`;

      for (const follower of followers) {
        const [inserted] = await db
          .insert(notifications)
          .values({
            userId: follower.userId,
            message: `${artist} released a new album "${album.name}"`,
            dedupeKey,
          })
          .onConflictDoNothing({
            target: [notifications.userId, notifications.dedupeKey],
          })
          .returning();

        if (inserted) {
          created += 1;
        }
      }
    } catch {
      // skip artist on last.fm error
    }
  }

  return created;
}

export function startReleaseChecker() {
  void checkNewReleases().catch(() => {
    // ignore failures on startup
  });

  const timer = setInterval(() => {
    void checkNewReleases().catch(() => {
      // ignore transient failures
    });
  }, CHECK_INTERVAL_MS);

  return () => clearInterval(timer);
}