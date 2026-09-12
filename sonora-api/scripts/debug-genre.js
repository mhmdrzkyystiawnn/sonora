require("dotenv").config({ path: ".env" });

async function main() {
  const url =
    process.env.LASTFM_API_URL +
    "?" +
    new URLSearchParams({
      method: "tag.gettoptracks",
      tag: "rock",
      api_key: process.env.LASTFM_API_KEY,
      format: "json",
    });

  const res = await fetch(url);
  const body = await res.json();
  console.log("status:", res.status);
  console.log("keys:", Object.keys(body));
  console.log(
    "toptracks?.track length:",
    body.toptracks?.track?.length,
  );
  if (!body.toptracks?.track?.length) {
    console.log(JSON.stringify(body).slice(0, 800));
  } else {
    console.log("first track:", JSON.stringify(body.toptracks.track[0]).slice(0, 300));
  }
}

main().catch((e) => console.error("FAILED:", e.message));