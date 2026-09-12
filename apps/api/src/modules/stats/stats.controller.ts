import type { Context } from "hono";
import { getStats } from "./stats.service.ts";

export async function getStatsController(c: Context) {
  const userId = c.get("userId") as string;
  const stats = await getStats(userId);
  return c.json({ data: stats });
}
