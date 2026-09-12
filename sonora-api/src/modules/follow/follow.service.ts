import type { AddFollowInput, Follow, Notification } from "../../shared/index.js";
import { addFollowSchema } from "../../shared/index.js";
import { db } from "../../db/client.ts";
import { ConflictError, NotFoundError } from "../../lib/api-error.ts";

interface FollowRow {
  id: string;
  name: string;
  url: string | null;
  image_url: string | null;
  mbid: string | null;
  created_at: Date;
}

interface NotificationRow {
  id: string;
  message: string;
  read: boolean;
  created_at: Date;
}

function toFollow(row: FollowRow): Follow {
  return {
    id: row.id,
    name: row.name,
    url: row.url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    mbid: row.mbid ?? undefined,
    createdAt: row.created_at.toISOString(),
  };
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    message: row.message,
    read: row.read,
    createdAt: row.created_at.toISOString(),
  };
}

function followKey(name: string): string {
  return `artist:${name}`.toLowerCase().trim();
}

export async function listFollows(userId: string): Promise<Follow[]> {
  const rows = await db.query<FollowRow>(
    `SELECT id, name, url, image_url, mbid, created_at
     FROM artist_follows
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  );

  return rows.map(toFollow);
}

export async function addFollow(
  userId: string,
  input: AddFollowInput,
): Promise<Follow> {
  const parsed = addFollowSchema.parse(input);
  const key = followKey(parsed.name);

  const existing = await db.query<{ id: string }>(
    `SELECT id FROM artist_follows WHERE user_id = $1 AND key = $2 LIMIT 1`,
    [userId, key],
  );

  if (existing.length > 0) {
    throw new ConflictError("already following this artist");
  }

  const rows = await db.query<FollowRow>(
    `INSERT INTO artist_follows (user_id, name, url, image_url, mbid, key)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, url, image_url, mbid, created_at`,
    [userId, parsed.name, parsed.url ?? null, parsed.imageUrl ?? null, parsed.mbid ?? null, key],
  );

  return toFollow(rows[0]);
}

export async function removeFollow(userId: string, followId: string) {
  const rows = await db.query<FollowRow>(
    `DELETE FROM artist_follows WHERE id = $1 AND user_id = $2
     RETURNING id, name, url, image_url, mbid, created_at`,
    [followId, userId],
  );

  if (rows.length === 0) {
    throw new NotFoundError("follow not found");
  }

  return toFollow(rows[0]);
}

export async function listNotifications(
  userId: string,
): Promise<Notification[]> {
  const rows = await db.query<NotificationRow>(
    `SELECT id, message, read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId],
  );

  return rows.map(toNotification);
}

export async function markNotificationRead(userId: string, id: string) {
  const rows = await db.query<NotificationRow>(
    `UPDATE notifications SET read = true
     WHERE id = $1 AND user_id = $2
     RETURNING id, message, read, created_at`,
    [id, userId],
  );

  if (rows.length === 0) {
    throw new NotFoundError("notification not found");
  }

  return toNotification(rows[0]);
}

export async function markAllNotificationsRead(userId: string) {
  await db.execute(
    `UPDATE notifications SET read = true
     WHERE user_id = $1 AND read = false`,
    [userId],
  );
}
