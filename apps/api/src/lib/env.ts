/// <reference lib="deno.ns" />

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  LASTFM_API_KEY: z.string().min(1, "LASTFM_API_KEY is required"),
  LASTFM_API_URL: z.url("LASTFM_API_URL must be a valid URL"),
  LASTFM_SHARED_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash-lite"),
  CORS_ORIGIN: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

const raw = Deno.env.toObject();

const parsed = envSchema.safeParse(raw);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `- ${issue.path.join(".") ?? "(root)"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
