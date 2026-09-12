import type { Context } from "hono";
import { loginSchema, registerSchema } from "../../shared/index.js";
import * as authService from "./auth.service.ts";

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

function getCookie(c: Context) {
  return c.req.header("cookie") ?? "";
}

async function setAuthCookie(c: Context, token: string) {
  c.header(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}; Path=/`,
  );
}

function clearAuthCookie(c: Context) {
  c.header(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`,
  );
}

export async function registerController(c: Context) {
  const body = await c.req.json();
  const input = registerSchema.safeParse(body);

  if (!input.success) {
    return c.json({ error: "invalid input", issues: input.error.issues }, 400);
  }

  try {
    const { user, token } = await authService.register(input.data);
    setAuthCookie(c, token);
    return c.json({ data: user }, 201);
  } catch (error) {
    throw error;
  }
}

export async function loginController(c: Context) {
  const body = await c.req.json();
  const input = loginSchema.safeParse(body);

  if (!input.success) {
    return c.json({ error: "invalid input", issues: input.error.issues }, 400);
  }

  try {
    const { user, token } = await authService.login(input.data);
    await setAuthCookie(c, token);
    return c.json({ data: user });
  } catch (error) {
    throw error;
  }
}

export function logoutController(c: Context) {
  clearAuthCookie(c);
  return c.json({ success: true });
}

export async function meController(c: Context) {
  const userId = c.get("userId") as string;
  const user = await authService.getMe(userId);
  return c.json({ data: user });
}
