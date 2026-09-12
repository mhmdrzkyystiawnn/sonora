/// <reference lib="cloudflare" />

import { Hono } from "hono";

const app = new Hono();

app.use("*", async (c, next) => {
  c.res.headers.set("Access-Control-Allow-Origin", "http://localhost:5173");
  c.res.headers.set("Access-Control-Allow-Credentials", "true");
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  if (c.req.method === "OPTIONS") return c.text("", 204);
  await next();
});

app.get("/api/health", (c) => c.json({ status: "ok", message: "sonora api is running" }));

export default {
  fetch: app.fetch,
};
