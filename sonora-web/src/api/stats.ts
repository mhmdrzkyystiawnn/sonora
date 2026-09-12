import type { Stats } from ".../shared/index";
import { request } from "./client";

export async function getStats(): Promise<Stats> {
  const response = await request<{ data: Stats }>("/api/stats/me");
  return response.data;
}