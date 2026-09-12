import type { Context } from "hono";
import { addFollowSchema } from "@sonora/shared";
import * as followService from "./follow.service.ts";
import { NotFoundError } from "../../lib/api-error.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseId(raw: string | string[] | undefined): string {
  if (typeof raw !== "string" || !UUID_PATTERN.test(raw)) {
    throw new NotFoundError("resource not found");
  }

  return raw;
}

export async function listFollowsController(c: Context) {
  const userId = c.get("userId") as string;

  try {
    const follows = await followService.listFollows(userId);
    return c.json({ data: follows });
  } catch (error) {
    throw error;
  }
}

export async function addFollowController(c: Context) {
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const input = addFollowSchema.safeParse(body);

  if (!input.success) {
    return c.json(
      {
        error: "invalid input",
        issues: input.error.issues,
      },
      400,
    );
  }

  try {
    const follow = await followService.addFollow(userId, input.data);
    return c.json({ data: follow }, 201);
  } catch (error) {
    throw error;
  }
}

export async function removeFollowController(c: Context) {
  const userId = c.get("userId") as string;
  const followId = parseId(c.req.param("id"));

  try {
    await followService.removeFollow(userId, followId);
    return c.json({ success: true });
  } catch (error) {
    throw error;
  }
}

export async function listNotificationsController(c: Context) {
  const userId = c.get("userId") as string;

  try {
    const notifications = await followService.listNotifications(userId);
    return c.json({ data: notifications });
  } catch (error) {
    throw error;
  }
}

export async function markNotificationReadController(c: Context) {
  const userId = c.get("userId") as string;
  const id = parseId(c.req.param("id"));

  try {
    const notification = await followService.markNotificationRead(userId, id);
    return c.json({ data: notification });
  } catch (error) {
    throw error;
  }
}

export async function markAllNotificationsReadController(c: Context) {
  const userId = c.get("userId") as string;

  try {
    await followService.markAllNotificationsRead(userId);
    return c.json({ success: true });
  } catch (error) {
    throw error;
  }
}
