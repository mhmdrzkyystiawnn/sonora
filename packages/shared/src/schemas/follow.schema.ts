import { z } from "zod";

export const followSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  url: z.url().optional(),
  imageUrl: z.url().optional(),
  mbid: z.string().optional(),
  createdAt: z.string(),
});

export const addFollowSchema = z.object({
  name: z.string().trim().min(1, "artist name is required"),
  url: z.url().optional(),
  imageUrl: z.url().optional(),
  mbid: z.string().optional(),
});

export const notificationSchema = z.object({
  id: z.uuid(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.string(),
});

export type Follow = z.infer<typeof followSchema>;
export type AddFollowInput = z.infer<typeof addFollowSchema>;
export type Notification = z.infer<typeof notificationSchema>;