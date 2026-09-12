import { z } from "zod";

export const recommendationSchema = z.object({
  name: z.string(),
  url: z.url(),
  imageUrl: z.url().optional(),
  listeners: z.string().optional(),
  playcount: z.string().optional(),
  artistName: z.string().optional(),
  previewUrl: z.url().optional(),
  reason: z.string().nullable(),
});

export const forYouSourceSchema = z.enum(["ai", "lastfm", "empty"]);

export const forYouResponseSchema = z.object({
  data: z.array(recommendationSchema),
  source: forYouSourceSchema,
});

export const similarToResponseSchema = z.object({
  artist: z.string(),
  data: z.array(recommendationSchema),
});

export const aiRerankResultSchema = z.array(
  z.object({
    name: z.string(),
    reason: z.string(),
  }),
);

export const moodRequestSchema = z.object({
  mood: z.string().min(1).max(200),
});

export const moodResponseSchema = z.object({
  data: z.array(recommendationSchema),
  source: forYouSourceSchema,
  mood: z.string(),
});

export const playlistDraftRequestSchema = z.object({
  prompt: z.string().min(1).max(500),
});

export const playlistDraftResponseSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type Recommendation = z.infer<typeof recommendationSchema>;
export type ForYouSource = z.infer<typeof forYouSourceSchema>;
export type ForYouResponse = z.infer<typeof forYouResponseSchema>;
export type SimilarToResponse = z.infer<typeof similarToResponseSchema>;
export type AiRerankResult = z.infer<typeof aiRerankResultSchema>;
export type MoodInput = z.infer<typeof moodRequestSchema>;
export type MoodResponse = z.infer<typeof moodResponseSchema>;
export type PlaylistDraftRequest = z.infer<typeof playlistDraftRequestSchema>;
export type PlaylistDraftResponse = z.infer<typeof playlistDraftResponseSchema>;