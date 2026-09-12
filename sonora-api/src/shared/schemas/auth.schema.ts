import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .email("invalid email")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "password must be at least 8 characters")
    .max(128, "password must be at most 128 characters"),
  displayName: z.string().trim().min(1, "display name is required").max(50),
});

export const loginSchema = z.object({
  email: z
    .email("invalid email")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "password is required").max(128),
});

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  displayName: z.string(),
  createdAt: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;