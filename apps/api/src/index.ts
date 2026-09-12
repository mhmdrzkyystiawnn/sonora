/// <reference lib="cloudflare" />

import { app } from "./app.ts";

interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  LASTFM_API_KEY: string;
  LASTFM_API_URL: string;
  LASTFM_SHARED_SECRET?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  CORS_ORIGIN?: string;
  NODE_ENV?: string;
}

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    // Inject env vars into Deno.env for compatibility
    (globalThis as unknown as { Deno: { env: { get: (k: string) => string | undefined } } }).Deno = {
      env: {
        get: (key: string) => env[key as keyof Env],
      },
    };

    return app.fetch(request);
  },
};
