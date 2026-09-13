import type { Context } from "hono";
import { loginSchema, registerSchema } from "../../shared/index.js";
import * as authService from "./auth.service.ts";

export async function registerController(c: Context) {
  const body = await c.req.json();
  const input = registerSchema.safeParse(body);

  if (!input.success) {
    return c.json({ error: "invalid input", issues: input.error.issues }, 400);
  }

  try {
    const { user, token } = await authService.register(input.data);
    return c.json({ data: user, token }, 201);
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
    return c.json({ data: user, token });
  } catch (error) {
    throw error;
  }
}

export function logoutController(c: Context) {
  return c.json({ success: true });
}

export async function meController(c: Context) {
  const userId = c.get("userId") as string;
  const user = await authService.getMe(userId);
  return c.json({ data: user });
}
