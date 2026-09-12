import type { LoginInput, RegisterInput, User } from "@sonora/shared";
import { request } from "./client";

export async function register(input: RegisterInput): Promise<User> {
  const response = await request<{ data: User }>("/api/auth/register", {
    method: "POST",
    body: input,
  });
  return response.data;
}

export async function login(input: LoginInput): Promise<User> {
  const response = await request<{ data: User }>("/api/auth/login", {
    method: "POST",
    body: input,
  });
  return response.data;
}

export async function logout(): Promise<void> {
  await request<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getMe(): Promise<User> {
  const response = await request<{ data: User }>("/api/auth/me");
  return response.data;
}