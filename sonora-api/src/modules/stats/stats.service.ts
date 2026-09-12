import type { Stats } from "../../shared/index.js";
import { statsSchema } from "../../shared/index.js";
import { db } from "../../db/client.ts";

export async function getStats(userId: string): Promise<Stats> {
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );

  const [[favCount, histCount, monthCount], topArtists, topTracks] =
    await Promise.all([
      Promise.all([
        db.query<{ value: number }>(
          `SELECT COUNT(id) AS value FROM favorites WHERE user_id = $1`,
          [userId],
        ),
        db.query<{ value: number }>(
          `SELECT COUNT(id) AS value FROM search_history WHERE user_id = $1`,
          [userId],
        ),
        db.query<{ value: number }>(
          `SELECT COUNT(id) AS value FROM search_history WHERE user_id = $1 AND created_at >= $2`,
          [userId, monthStart],
        ),
      ]),
      db.query<{ name: string; count: number }>(
        `SELECT artist_name AS name, COUNT(id) AS count
         FROM favorites
         WHERE user_id = $1 AND artist_name IS NOT NULL
         GROUP BY artist_name
         ORDER BY count DESC
         LIMIT 10`,
        [userId],
      ),
      db.query<{ name: string; artist_name: string; count: number }>(
        `SELECT name, artist_name, COUNT(id) AS count
         FROM favorites
         WHERE user_id = $1 AND kind = 'track' AND artist_name IS NOT NULL
         GROUP BY name, artist_name
         ORDER BY count DESC
         LIMIT 10`,
        [userId],
      ),
    ]);

  return statsSchema.parse({
    totalFavorites: Number(favCount[0]?.value ?? 0),
    totalListens: Number(histCount[0]?.value ?? 0),
    listensThisMonth: Number(monthCount[0]?.value ?? 0),
    topArtists: topArtists.map((row) => ({
      name: row.name ?? "Unknown",
      artistName: null,
      count: Number(row.count),
    })),
    topTracks: topTracks.map((row) => ({
      name: row.name,
      artistName: row.artist_name,
      count: Number(row.count),
    })),
  });
}
