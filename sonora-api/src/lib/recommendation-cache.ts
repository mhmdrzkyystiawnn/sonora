import { db } from "../db/client.ts";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface RecommendationCacheRow {
  id: string;
  payload: unknown;
  created_at: Date;
}

export async function getCachedRecommendation<T>(
  userId: string,
  key: string,
): Promise<T | null> {
  const rows = await db.query<RecommendationCacheRow>(
    `SELECT id, payload, created_at
     FROM recommendation_cache
     WHERE user_id = $1 AND key = $2
     LIMIT 1`,
    [userId, key],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  if (Date.now() - new Date(row.created_at).getTime() > CACHE_TTL_MS) {
    await db.query(
      `DELETE FROM recommendation_cache WHERE id = $1`,
      [row.id],
    );
    return null;
  }

  return row.payload as T;
}

export async function setCachedRecommendation(
  userId: string,
  key: string,
  payload: unknown,
): Promise<void> {
  await db.query(
    `INSERT INTO recommendation_cache (user_id, key, payload, created_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (user_id, key)
     DO UPDATE SET payload = $3, created_at = now()`,
    [userId, key, JSON.stringify(payload)],
  );
}

export async function invalidateRecommendationCache(
  userId: string,
  key?: string,
): Promise<void> {
  if (key) {
    await db.query(
      `DELETE FROM recommendation_cache WHERE user_id = $1 AND key = $2`,
      [userId, key],
    );
    return;
  }

  await db.query(
    `DELETE FROM recommendation_cache WHERE user_id = $1`,
    [userId],
  );
}
