const { Pool } = require("pg");
require("dotenv").config({ path: ".env" });

const base = "http://localhost:3100";

function makeSession() {
  let cookie = "";
  return {
    async req(path, opts = {}) {
      const headers = {};
      if (opts.json) headers["Content-Type"] = "application/json";
      if (cookie) headers.Cookie = cookie;

      const res = await fetch(base + path, {
        method: opts.method || "GET",
        headers,
        body: opts.json ? JSON.stringify(opts.json) : undefined,
      });

      const setCookie = res.headers.get("set-cookie");
      if (setCookie) cookie = setCookie.split(";")[0];

      let body = null;
      try {
        body = await res.json();
      } catch {}

      return { status: res.status, body };
    },
  };
}

function assert(cond, label) {
  console.log((cond ? "PASS" : "FAIL") + " - " + label);
  if (!cond) process.exitCode = 1;
}

async function main() {
  const emailA = `follow-a-${Date.now()}@sonora.test`;
  const emailB = `follow-b-${Date.now()}@sonora.test`;
  const password = "password123";
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const a = makeSession();
  const b = makeSession();
  const anon = makeSession();

  let r = await a.req("/api/auth/register", {
    method: "POST",
    json: { email: emailA, password, displayName: "Follow A" },
  });
  assert(r.status === 201, "setup: register user A");

  r = await b.req("/api/auth/register", {
    method: "POST",
    json: { email: emailB, password, displayName: "Follow B" },
  });
  assert(r.status === 201, "setup: register user B");

  r = await anon.req("/api/follows");
  assert(r.status === 401, "follows unauthenticated -> 401");

  r = await a.req("/api/follows", {
    method: "POST",
    json: { name: "Daft Punk", url: "https://www.last.fm/music/Daft+Punk" },
  });
  assert(r.status === 201 && r.body.data.name === "Daft Punk", "follow artist -> 201");

  const followId = r.body.data.id;

  r = await a.req("/api/follows", {
    method: "POST",
    json: { name: "daft punk" },
  });
  assert(r.status === 409, "duplicate follow -> 409");

  r = await a.req("/api/follows", { method: "POST", json: { name: "" } });
  assert(r.status === 400, "empty name -> 400");

  r = await a.req("/api/follows");
  assert(r.status === 200 && r.body.data.length === 1, "list follows -> 1 item");

  r = await a.req("/api/notifications");
  assert(r.status === 200 && Array.isArray(r.body.data), "list notifications -> 200 array");

  r = await a.req("/api/notifications/read-all", { method: "POST" });
  assert(r.status === 200, "mark all read -> 200");

  r = await b.req("/api/follows/" + followId, { method: "DELETE" });
  assert(r.status === 404, "user B cannot unfollow user A's artist -> 404");

  r = await a.req("/api/follows/" + followId, { method: "DELETE" });
  assert(r.status === 200, "user A unfollow -> 200");

  r = await a.req("/api/follows");
  assert(r.status === 200 && r.body.data.length === 0, "follows empty after unfollow");

  await pool.query("delete from users where email = $1", [emailA]);
  await pool.query("delete from users where email = $1", [emailB]);
  await pool.end();
  console.log("cleanup: deleted test users");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});