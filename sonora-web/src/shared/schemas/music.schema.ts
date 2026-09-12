import { z } from "zod";

export const musicSchema = z.object({
  title: z.string(),
  artist: z.string(),
  url: z.url(),
  playCount: z.string().optional(),
  imageUrl: z.url().optional(),
  previewUrl: z.url().optional(),
});

export const musicSearchResponseSchema = z.object({
  data: z.array(musicSchema),
});

export const musicSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "query cannot be empty"),
});

export const trackDetailSchema = musicSchema.extend({
  album: z.string().optional(),
  duration: z.string().optional(),
  listeners: z.string().optional(),
  summary: z.string().optional(),
  tags: z
    .array(
      z.object({
        name: z.string(),
        url: z.url(),
      }),
    )
    .optional(),
});

export type Music = z.infer<typeof musicSchema>;
export type MusicSearchResponse = z.infer<typeof musicSearchResponseSchema>;
export type MusicSearchQuery = z.infer<typeof musicSearchQuerySchema>;
export type TrackDetail = z.infer<typeof trackDetailSchema>;