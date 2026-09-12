import { z } from "zod";

export const topItemSchema = z.object({
  name: z.string(),
  artistName: z.string().nullable(),
  count: z.number(),
});

export const statsSchema = z.object({
  totalFavorites: z.number(),
  totalListens: z.number(),
  listensThisMonth: z.number(),
  topArtists: z.array(topItemSchema),
  topTracks: z.array(topItemSchema),
});

export type TopItem = z.infer<typeof topItemSchema>;
export type Stats = z.infer<typeof statsSchema>;