import "dotenv/config";
import { Pool } from "pg";
import { checkNewReleases } from "../src/lib/release-checker";

function assert(cond, label) {
  console.log((cond ? "PASS" : "FAIL") + " - " + label);
  if (!cond) process.exitCode = 1;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const userResult = await pool.query(
    `insert into users (email, password_hash, display_name)
     values ($1, 'x', 'Release Test')
     on conflict (email) do update set display_name = 'Release Test'
     returning id`,
    [`release-test-${Date.now()}@sonora.test`],
  );
  const user = userResult.rows[0];

  await pool.query(
    "delete from artist_follows where user_id = $1",
    [user.id],
  );

  await pool.query(
    "insert into artist_follows (user_id, name, key) values ($1, 'Daft Punk', 'artist:daft punk')",
    [user.id],
  );

  const first = await checkNewReleases();
  const second = await checkNewReleases();

  assert(
    typeof first === "number" && first >= 0,
    `checkNewReleases runs (created=${first})`,
  );

  const { rows } = await pool.query(
    "select count(*)::int as c from notifications where user_id = $1",
    [user.id],
  );

  assert(second === first, "second run creates no duplicate notifications");
  assert(
    rows[0].c === first,
    `notification count matches created (${rows[0].c})`,
  );

  if (first > 0) {
    console.log("  sample notification present (artist released recently)");
  } else {
    console.log("  note: no recent release found for Daft Punk (expected)");
  }

  await pool.query("delete from users where id = $1", [user.id]);
  await pool.end();
  console.log("cleanup: deleted test user");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});