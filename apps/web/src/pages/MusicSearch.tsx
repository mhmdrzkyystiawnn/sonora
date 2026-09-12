import { useState } from "react";
import { Link } from "react-router-dom";
import type { Music } from "@sonora/shared";
import { Music2, Search } from "lucide-react";
import { searchMusic } from "../api/music";
import { FavoriteButton } from "../components/FavoriteButton";
import { AudioPreviewButton } from "../components/AudioPreviewButton";

export function MusicSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Music[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    const value = query.trim();

    if (!value) return;

    setLoading(true);
    setError(null);

    try {
      const music = await searchMusic(value);
      setResults(music);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "failed to search music");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void handleSearch();
  }

  return (
    <div className="py-12 sm:py-16">
      {/* header */}
      <header className="max-w-3xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          music discovery
        </p>

        <h1 className="font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
          find something worth listening to.
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          search songs, artists, and discover music through last.fm.
        </p>
      </header>

      {/* search */}
      <form
        onSubmit={handleSubmit}
        className="mt-10 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="search a song or artist..."
            className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "searching..." : "search"}
        </button>
      </form>

      {/* error */}
      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* results */}
      {results.length > 0 && (
        <section className="mt-14">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold">
              search results
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              found {results.length} tracks for "{query}"
            </p>
          </div>

          <div className="grid gap-3">
            {results.map((music, index) => (
              <div
                key={`${music.url}-${index}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/50 hover:bg-accent"
              >
                <Link
                  to={`/music/${encodeURIComponent(music.artist)}/${encodeURIComponent(music.title)}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  {/* artwork */}
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-18">
                    {music.imageUrl ? (
                      <img
                        src={music.imageUrl}
                        alt={music.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <Music2 className="size-6" />
                      </div>
                    )}
                  </div>

                  {/* info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold transition group-hover:text-primary">
                      {music.title}
                    </h3>

                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {music.artist}
                    </p>
                  </div>
                </Link>

                {/* playcount */}
                {music.playCount && (
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {Number(music.playCount).toLocaleString()} plays
                  </span>
                )}

                {/* preview */}
                <AudioPreviewButton
                  src={music.previewUrl}
                  label={music.title}
                  className="shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary transition hover:bg-primary hover:text-primary-foreground"
                />

                {/* favorite */}
                <FavoriteButton
                  kind="track"
                  name={music.title}
                  artistName={music.artist}
                  imageUrl={music.imageUrl}
                  url={music.url}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* empty state */}
      {!loading && query && results.length === 0 && !error && (
        <div className="mt-14 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Music2 className="size-5" />
          </div>

          <p className="mt-4 text-sm font-medium">
            no music found.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            try searching for another song or artist.
          </p>
        </div>
      )}
    </div>
  );
}
