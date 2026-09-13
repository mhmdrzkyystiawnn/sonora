import type { Context, Next } from "hono";
import { ApiError } from "../api-error.ts";
import { verifyAccessToken } from "./jwt.ts";

export async function requireAuth(c: Context, next: Next) {
  // Try Authorization header first, then cookie
  let token: string | undefined;

  const authHeader = c.req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    const cookie = c.req.header("cookie");
    if (cookie) {
      const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
      token = match?.[1];
    }
  }

  if (!token) {
    throw new ApiError(401, "authentication required");
  }

  c.set("userId", await verifyAccessToken(token));
  await next();
}
