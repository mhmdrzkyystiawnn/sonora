import type { LoginInput, RegisterInput, User } from "../shared/index";
import { request } from "./client";

export interface AuthResponse {
  data: User;
  token?: string;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: input,
  });
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
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
