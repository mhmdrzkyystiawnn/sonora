import { and, desc, eq } from "drizzle-orm";
import type { AddFollowInput, Follow, Notification } from "@sonora/shared";
import { addFollowSchema } from "@sonora/shared";
import { db } from "../../db/client.ts";
import type {
  ArtistFollowRow,
  NotificationRow,
} from "../../db/schema.ts";
import { artistFollows, notifications } from "../../db/schema.ts";
import { ConflictError, NotFoundError } from "../../lib/api-error.ts";

function toFollow(row: ArtistFollowRow): Follow {
  return {
    id: row.id,
    name: row.name,
    url: row.url ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    mbid: row.mbid ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function toNotification(
  row: NotificationRow,
): Notification {
  return {
    id: row.id,
    message: row.message,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
  };
}

function followKey(name: string): string {
  return `artist:${name}`.toLowerCase().trim();
}

export async function listFollows(userId: string): Promise<Follow[]> {
  const rows = await db
    .select()
    .from(artistFollows)
    .where(eq(artistFollows.userId, userId))
    .orderBy(desc(artistFollows.createdAt));

  return rows.map(toFollow);
}

export async function addFollow(
  userId: string,
  input: AddFollowInput,
): Promise<Follow> {
  const parsed = addFollowSchema.parse(input);
  const key = followKey(parsed.name);

  const [existing] = await db
    .select({ id: artistFollows.id })
    .from(artistFollows)
    .where(
      and(eq(artistFollows.userId, userId), eq(artistFollows.key, key)),
    )
    .limit(1);

  if (existing) {
    throw new ConflictError("already following this artist");
  }

  const [row] = await db
    .insert(artistFollows)
    .values({
      userId,
      name: parsed.name,
      url: parsed.url ?? null,
      imageUrl: parsed.imageUrl ?? null,
      mbid: parsed.mbid ?? null,
      key,
    })
    .returning();

  return toFollow(row);
}

export async function removeFollow(userId: string, followId: string) {
  const [deleted] = await db
    .delete(artistFollows)
    .where(
      and(eq(artistFollows.id, followId), eq(artistFollows.userId, userId)),
    )
    .returning();

  if (!deleted) {
    throw new NotFoundError("follow not found");
  }

  return toFollow(deleted);
}

export async function listNotifications(
  userId: string,
): Promise<Notification[]> {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return rows.map(toNotification);
}

export async function markNotificationRead(userId: string, id: string) {
  const [updated] = await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning();

  if (!updated) {
    throw new NotFoundError("notification not found");
  }

  return toNotification(updated);
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.read, false)),
    );
}
