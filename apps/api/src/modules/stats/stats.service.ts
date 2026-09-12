import { and, count, desc, eq, gte, isNotNull } from "drizzle-orm";
import type { Stats } from "@sonora/shared";
import { statsSchema } from "@sonora/shared";
import { db } from "../../db/client.ts";
import type {
  FavoriteRow,
  HistoryRow,
} from "../../db/schema.ts";
import { favorites, searchHistory } from "../../db/schema.ts";

export async function getStats(userId: string): Promise<Stats> {
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );

  const [[favCount], [histCount], [monthCount]] = await Promise.all([
    db
      .select({ value: count(favorites.id) })
      .from(favorites)
      .where(eq(favorites.userId, userId)),
    db
      .select({ value: count(searchHistory.id) })
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId)),
    db
      .select({ value: count(searchHistory.id) })
      .from(searchHistory)
      .where(
        and(eq(searchHistory.userId, userId), gte(searchHistory.createdAt, monthStart)),
      ),
  ]);

  const [topArtists, topTracks] = await Promise.all([
    db
      .select({
        name: favorites.artistName,
        count: count(favorites.id),
      })
      .from(favorites)
      .where(
        and(eq(favorites.userId, userId), isNotNull(favorites.artistName)),
      )
      .groupBy(favorites.artistName)
      .orderBy(desc(count(favorites.id)))
      .limit(10),
    db
      .select({
        name: favorites.name,
        artistName: favorites.artistName,
        count: count(favorites.id),
      })
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.kind, "track"),
          isNotNull(favorites.artistName),
        ),
      )
      .groupBy(favorites.name, favorites.artistName)
      .orderBy(desc(count(favorites.id)))
      .limit(10),
  ]);

  return statsSchema.parse({
    totalFavorites: Number(favCount.value),
    totalListens: Number(histCount.value),
    listensThisMonth: Number(monthCount.value),
    topArtists: topArtists.map((row) => ({
      name: row.name ?? "Unknown",
      artistName: null,
      count: Number(row.count),
    })),
    topTracks: topTracks.map((row) => ({
      name: row.name,
      artistName: row.artistName,
      count: Number(row.count),
    })),
  });
}