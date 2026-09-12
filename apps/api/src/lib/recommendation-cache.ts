import { and, eq } from "drizzle-orm";
import { db } from "../db/client.ts";
import { recommendationCache } from "../db/schema.ts";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getCachedRecommendation<T>(
  userId: string,
  key: string,
): Promise<T | null> {
  const [row] = await db
    .select()
    .from(recommendationCache)
    .where(
      and(
        eq(recommendationCache.userId, userId),
        eq(recommendationCache.key, key),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  if (Date.now() - row.createdAt.getTime() > CACHE_TTL_MS) {
    await db
      .delete(recommendationCache)
      .where(eq(recommendationCache.id, row.id));
    return null;
  }

  return row.payload as T;
}

export async function setCachedRecommendation(
  userId: string,
  key: string,
  payload: unknown,
): Promise<void> {
  await db
    .insert(recommendationCache)
    .values({ userId, key, payload: payload as never })
    .onConflictDoUpdate({
      target: [recommendationCache.userId, recommendationCache.key],
      set: { payload: payload as never, createdAt: new Date() },
    });
}

export async function invalidateRecommendationCache(
  userId: string,
  key?: string,
): Promise<void> {
  if (key) {
    await db
      .delete(recommendationCache)
      .where(
        and(
          eq(recommendationCache.userId, userId),
          eq(recommendationCache.key, key),
        ),
      );
    return;
  }

  await db
    .delete(recommendationCache)
    .where(eq(recommendationCache.userId, userId));
}