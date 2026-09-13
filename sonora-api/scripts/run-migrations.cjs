const { neon } = require("@neondatabase/serverless");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

function loadDevVars() {
  const result = {};
  try {
    const content = readFileSync(resolve(process.cwd(), ".dev.vars"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {}
  return result;
}

const devVars = loadDevVars();
const DATABASE_URL = process.env.DATABASE_URL || devVars["DATABASE_URL"];

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = neon(DATABASE_URL);

async function run() {
  const migrations = [
    "drizzle/0000_outstanding_avengers.sql",
    "drizzle/0001_discovery_cache.sql",
    "drizzle/0002_genre_cache.sql",
    "drizzle/0003_music_cache.sql",
  ];

  for (const file of migrations) {
    const sql = readFileSync(resolve(process.cwd(), file), "utf-8");
    const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(s => s);
    
    for (const stmt of statements) {
      try {
        await client(stmt);
        console.log("OK:", file);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("already exists")) {
          console.log("SKIP (exists):", file);
        } else {
          console.error("FAIL:", file, msg);
        }
      }
    }
  }
  
  console.log("Done!");
}

run().catch(console.error);
