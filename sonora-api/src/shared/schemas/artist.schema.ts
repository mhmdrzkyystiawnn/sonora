import { z } from "zod";
import { musicSchema } from "./music.schema.ts";

export const artistSearchResultSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  imageUrl: z.string().url().optional(),
  listeners: z.string().optional(),
  playcount: z.string().optional(),
});

export const artistSchema = artistSearchResultSchema.extend({
  bio: z
    .object({
      summary: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),

  tags: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
    }),
  ),
});

export const artistSearchSchema = z.object({
  query: z.string().min(1),
});

export const artistTracksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const artistTracksResponseSchema = z.object({
  artist: z.string(),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(1),
  data: z.array(musicSchema),
});

export type Artist = z.infer<typeof artistSchema>;
export type ArtistSearchResult = z.infer<typeof artistSearchResultSchema>;
export type ArtistTracksQuery = z.infer<typeof artistTracksQuerySchema>;
export type ArtistTracksResponse = z.infer<typeof artistTracksResponseSchema>;