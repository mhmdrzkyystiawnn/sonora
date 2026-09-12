import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],
  resolve: {
    alias: {
      "hono/cors": "hono/dist/middleware/cors/index.js",
      "hono/logger": "hono/dist/middleware/logger/index.js",
      "hono/factory": "hono/dist/helper/factory/index.js",
    },
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
});
