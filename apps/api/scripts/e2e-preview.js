const base = "http://localhost:3100";

function assert(cond, label) {
  console.log((cond ? "PASS" : "FAIL") + " - " + label);
  if (!cond) process.exitCode = 1;
}

async function main() {
  let r = await fetch(base + "/api/music/search?q=" + encodeURIComponent("Daft Punk"));
  assert(r.status === 200, "search -> 200");
  const search = await r.json();
  const withPreview = search.data.filter((t) => t.previewUrl);
  console.log(`  tracks: ${search.data.length}, with previewUrl: ${withPreview.length}`);
  assert(withPreview.length > 0, "search results include previewUrl");
  assert(
    search.data.every((t) => t.imageUrl === undefined || typeof t.imageUrl === "string"),
    "imageUrl still present on search results",
  );

  const first = search.data[0];
  r = await fetch(
    base + "/api/music/" + encodeURIComponent(first.artist) + "/" + encodeURIComponent(first.title),
  );
  assert(r.status === 200, "track detail -> 200");
  const detail = await r.json();
  console.log(`  detail "${first.artist} - ${first.title}" previewUrl: ${detail.data.previewUrl ? "yes" : "no"}`);
  assert(!!detail.data.previewUrl, "track detail includes previewUrl");

  r = await fetch(base + "/api/discovery/popular-tracks");
  assert(r.status === 200, "popular-tracks -> 200");
  const popular = await r.json();
  const popPreview = popular.filter((t) => t.previewUrl);
  console.log(`  popular: ${popular.length}, with previewUrl: ${popPreview.length}`);
  assert(popPreview.length > 0, "popular tracks include previewUrl");

  r = await fetch(base + "/api/music/" + encodeURIComponent(first.artist) + "/" + encodeURIComponent(first.title) + "/similar");
  assert(r.status === 200, "similar tracks -> 200");
  const similar = await r.json();
  assert(similar.data.some((t) => t.previewUrl), "similar tracks include previewUrl");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});