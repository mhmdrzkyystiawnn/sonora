import { neon } from "@neondatabase/serverless";

const DATABASE_URL = "postgresql://neondb_owner:npg_0v2qOGMtpeij@ep-broad-snow-b3gmsfar-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const client = neon(DATABASE_URL);

async function test() {
  try {
    const result = await client`SELECT COUNT(*) as count FROM users`;
    console.log("✅ Database connected!");
    console.log("Users count:", result[0].count);
  } catch (e) {
    console.error("❌ Database error:", e.message);
  }
}

test();
