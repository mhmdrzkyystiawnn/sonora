import type { Stats } from "@sonora/shared";
import { request } from "./client";

export async function getStats(): Promise<Stats> {
  const response = await request<{ data: Stats }>("/api/stats/me");
  return response.data;
}