import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { Pool } from "pg";
import { app } from "../src/app";

const testEmail = `it-${Date.now()}@sonora.test`;

let pool: Pool;
const createdUserIds: string[] = [];

const lastFmFixtures: Record<string, unknown> = {
  "track.search": {
    results: {
      trackmatches: {
        track: [
          {
            name: "Test Track",
            artist: "Test Artist",
            url: "https://www.last.fm/music/Test+Artist/_/Test+Track",
            image: [],
          },
        ],
      },
    },
  },
  "artist.search": {
    results: {
      artistmatches: {
        artist: [
          {
            name: "Test Artist",
            url: "https://www.last.fm/music/Test+Artist",
            image: [],
            listeners: "12345",
            mbid: "mbid-test-1",
          },
        ],
      },
    },
  },
  "chart.gettoptracks": {
    tracks: {
      track: [
        {
          name: "Top Track",
          url: "https://www.last.fm/music/Top+Artist/_/Top+Track",
          playcount: "100",
          artist: { name: "Top Artist", url: "https://www.last.fm/music/Top+Artist" },
          image: [],
        },
      ],
    },
  },
  "chart.gettopartists": {
    artists: {
      artist: [
        {
          name: "Top Artist",
          url: "https://www.last.fm/music/Top+Artist",
          image: [],
          listeners: "999",
        },
      ],
    },
  },
  "artist.getsimilar": {
    similarartists: {
      artist: [
        {
          name: "Similar Artist",
          url: "https://www.last.fm/music/Similar+Artist",
          image: [],
          listeners: "500",
        },
      ],
    },
  },
  "track.getsimilar": { similartracks: { track: [] } },
  "tag.gettoptracks": {
    tracks: {
      track: [
        {
          name: "Genre Track",
          url: "https://www.last.fm/music/Genre+Artist/_/Genre+Track",
          playcount: "50",
          artist: { name: "Genre Artist", url: "https://www.last.fm/music/Genre+Artist" },
          image: [],
        },
      ],
      "@attr": {
        page: "1",
        perPage: "10",
        total: "25",
        totalPages: "3",
      },
    },
  },
  "tag.gettopartists": { topartists: { artist: [] } },
  "artist.gettoptracks": { toptracks: { track: [] } },
  "artist.gettopalbums": { topalbums: { album: [] } },
};

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function installFetchStub() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const host = url.hostname;

    if (host.includes("generativelanguage")) {
      return jsonResponse({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    { name: "Similar Artist", artistName: "", reason: "matches the vibe" },
                  ]),
                },
              ],
            },
          },
        ],
      });
    }

    if (host.includes("itunes")) {
      return jsonResponse({ results: [] });
    }

    if (host.includes("audioscrobbler")) {
      const method = url.searchParams.get("method");
      return jsonResponse(lastFmFixtures[method ?? ""] ?? {});
    }

    return jsonResponse({});
  });

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

beforeAll(async () => {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
});

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await pool.query("delete from users where id = any($1)", [
      createdUserIds,
    ]);
  }
  await pool.end();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  installFetchStub();
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("music search", () => {
  it("returns enriched tracks", async () => {
    const res = await request(app).get("/api/music/search").query({ q: "test" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].title).toBe("Test Track");
    expect(res.body.data[0].artist).toBe("Test Artist");
  });

  it("rejects invalid query", async () => {
    const res = await request(app).get("/api/music/search");
    expect(res.status).toBe(400);
  });
});

describe("artist search", () => {
  it("returns artists", async () => {
    const res = await request(app).get("/api/artists/search").query({ q: "test" });
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe("Test Artist");
  });
});

describe("genre tracks", () => {
  it("returns paginated tracks and forwards page/limit to last.fm", async () => {
    const res = await request(app)
      .get("/api/genre/rock/tracks")
      .query({ page: 2, limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.tag).toBe("rock");
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(10);
    expect(res.body.total).toBe(25);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.data[0].title).toBe("Genre Track");

    const fetchMock = vi.mocked(globalThis.fetch);
    const calls = fetchMock.mock.calls.map((call) => String(call[0]));
    const genreCall = calls.find((url) => url.includes("method=tag.gettoptracks"));
    expect(genreCall).toBeDefined();
    expect(genreCall).toContain("page=2");
    expect(genreCall).toContain("limit=10");
  });

  it("uses defaults when page is omitted", async () => {
    const res = await request(app).get("/api/genre/rock/tracks");
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
  });

  it("rejects invalid page", async () => {
    const res = await request(app).get("/api/genre/rock/tracks").query({ page: "abc" });
    expect(res.status).toBe(400);
  });
});

describe("discovery", () => {
  it("returns popular tracks", async () => {
    const res = await request(app).get("/api/discovery/popular-tracks");
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe("Top Track");
  });
});

describe("auth + library + recommendation", () => {
  let agent: ReturnType<typeof request.agent>;

  beforeEach(() => {
    agent = request.agent(app);
  });

  it("registers, logs in, favorites a track, gets ai recommendation", async () => {
    const register = await agent.post("/api/auth/register").send({
      email: testEmail,
      password: "password123",
      displayName: "IT User",
    });
    expect(register.status).toBe(201);
    createdUserIds.push(register.body.data.id);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(testEmail);

    const fav = await agent.post("/api/library/favorites").send({
      kind: "artist",
      name: "Test Artist",
      key: "artist:test artist",
    });
    expect(fav.status).toBe(201);

    const list = await agent.get("/api/library/favorites");
    expect(list.status).toBe(200);
    expect(list.body.data.some((f: { name: string }) => f.name === "Test Artist")).toBe(true);

    const forYou = await agent.get("/api/recommendation/for-you");
    expect(forYou.status).toBe(200);
    expect(forYou.body.source).toBe("ai");
    expect(forYou.body.data[0].name).toBe("Similar Artist");
  });
});

describe("404 handling", () => {
  it("returns json 404 for unknown route", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
    expect(typeof res.body.error).toBe("string");
  });
});