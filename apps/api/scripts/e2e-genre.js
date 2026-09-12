const base = "http://localhost:3100";

function assert(cond, label) {
  console.log((cond ? "PASS" : "FAIL") + " - " + label);
  if (!cond) process.exitCode = 1;
}

async function main() {
  let r = await fetch(base + "/api/genre/rock/tracks");
  assert(r.status === 200, "genre/rock/tracks -> 200");
  let body = await r.json();
  assert(body.tag === "rock", "response includes tag");
  assert(body.data.length > 0, "tracks non-empty");
  assert(body.data.every((t) => t.title && t.artist && t.url), "tracks well-formed");
  assert(
    body.data.some((t) => t.previewUrl),
    "some genre tracks have previewUrl",
  );

  r = await fetch(base + "/api/genre/rock/artists");
  assert(r.status === 200, "genre/rock/artists -> 200");
  body = await r.json();
  assert(body.data.length > 0, "artists non-empty");
  assert(body.data.every((a) => a.name && a.url), "artists well-formed");

  r = await fetch(base + "/api/genre/city%20pop/tracks");
  assert(r.status === 200, "genre/city pop/tracks -> 200 (URL-encoded space)");
  body = await r.json();
  assert(body.data.length > 0, "city pop tracks non-empty");

  r = await fetch(base + "/api/genre/metaldeth/tracks");
  assert(r.status === 404, "unknown genre -> 404");

  r = await fetch(base + "/api/genre/pop/tracks", { method: "POST" });
  assert(r.status === 404 || r.status === 405, "wrong method not allowed");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});