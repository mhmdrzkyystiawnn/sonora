import { z } from "zod";
import { musicSchema } from "./music.schema.ts";

export const genreTracksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const genreTracksResponseSchema = z.object({
  tag: z.string(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(1),
  data: z.array(musicSchema),
});

export type GenreTracksQuery = z.infer<typeof genreTracksQuerySchema>;
export type GenreTracksResponse = z.infer<typeof genreTracksResponseSchema>;
