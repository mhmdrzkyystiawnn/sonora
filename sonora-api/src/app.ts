/// <reference lib="cloudflare" />

import { Hono } from "hono";
import { env } from "./lib/env";

const app = new Hono();

app.use("*", async (c, next) => {
  const origin = env.CORS_ORIGIN ?? "https://sonora.muhamadrizky.my.id";
  c.res.headers.set("Access-Control-Allow-Origin", origin);
  c.res.headers.set("Access-Control-Allow-Credentials", "true");
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (c.req.method === "OPTIONS") return c.text("", 204);
  await next();
});

app.get("/api/health", (c) => c.json({ status: "ok", message: "sonora api is running" }));

export default app;
