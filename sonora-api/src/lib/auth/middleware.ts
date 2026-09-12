import type { Context, Next } from "hono";
import { ApiError } from "../api-error.ts";
import { verifyAccessToken } from "./jwt.ts";

export async function requireAuth(c: Context, next: Next) {
  const cookie = c.req.header("cookie");
  let token: string | undefined;

  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
    token = match?.[1];
  }

  if (!token) {
    throw new ApiError(401, "authentication required");
  }

  c.set("userId", await verifyAccessToken(token));
  await next();
}
