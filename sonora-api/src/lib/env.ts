import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().default(""),
  JWT_SECRET: z.string().default(""),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  LASTFM_API_KEY: z.string().default(""),
  LASTFM_API_URL: z.string().default(""),
  LASTFM_SHARED_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash-lite"),
  CORS_ORIGIN: z.string().optional(),
  NODE_ENV: z.string().optional(),
});

function getEnv(name: string): string | undefined {
  const g = globalThis as unknown as { __env__?: Record<string, string | undefined> };
  if (g.__env__?.[name]) return g.__env__[name];
  
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    if (meta.env?.[name]) return meta.env[name];
  } catch {}
  
  return undefined;
}

const parsed = envSchema.safeParse({
  PORT: getEnv("PORT"),
  DATABASE_URL: getEnv("DATABASE_URL"),
  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN"),
  LASTFM_API_KEY: getEnv("LASTFM_API_KEY"),
  LASTFM_API_URL: getEnv("LASTFM_API_URL"),
  LASTFM_SHARED_SECRET: getEnv("LASTFM_SHARED_SECRET"),
  GEMINI_API_KEY: getEnv("GEMINI_API_KEY"),
  GEMINI_MODEL: getEnv("GEMINI_MODEL"),
  CORS_ORIGIN: getEnv("CORS_ORIGIN"),
  NODE_ENV: getEnv("NODE_ENV"),
});

export const env = parsed.success ? parsed.data : envSchema.parse({});
