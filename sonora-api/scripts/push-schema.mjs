import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const DATABASE_URL = "postgresql://neondb_owner:npg_0v2qOGMtpeij@ep-broad-snow-b3gmsfar-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const client = neon(DATABASE_URL);

async function run() {
  const sql = readFileSync("./drizzle/0000_outstanding_avengers.sql", "utf-8");
  
  // Split by statement-breakpoint
  const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(s => s);
  
  for (const stmt of statements) {
    try {
      await client(stmt);
      console.log("OK:", stmt.substring(0, 50) + "...");
    } catch (e) {
      console.error("FAIL:", stmt.substring(0, 50) + "...");
      console.error(e.message);
    }
  }
  
  console.log("Done!");
}

run().catch(console.error);
