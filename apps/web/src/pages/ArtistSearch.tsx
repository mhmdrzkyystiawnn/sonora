import { useState } from "react";
import { Link } from "react-router-dom";
import type { ArtistSearchResult } from "@sonora/shared";
import { Search, Users, User, ArrowRight } from "lucide-react";
import { searchArtists } from "../api/artist";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ArtistSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtistSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    const value = query.trim();

    if (!value) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const artists = await searchArtists(value);
      setResults(artists);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "failed to search artists");
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
          artist discovery
        </p>

        <h1 className="font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
          explore your favorite artists.
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          search artists, read bios, and discover their top-performing tracks.
        </p>
      </header>

      {/* search form */}
      <form
        onSubmit={handleSubmit}
        className="mt-10 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="search an artist..."
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

      {/* error state */}
      {error && (
        <Alert variant="destructive" className="mt-6 border-destructive/30 bg-destructive/10">
          <AlertTitle className="font-bold">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* loading skeleton */}
      {loading && (
        <div className="mt-14">
          <div className="mb-6 h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 animate-pulse animate-duration-1000"
              >
                <Skeleton className="size-16 rounded-xl shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* results grid */}
      {!loading && results.length > 0 && (
        <section className="mt-14">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold">
              search results
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              found {results.length} artists for "{query}"
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((artist) => (
              <Link
                key={artist.name}
                to={`/artist/${encodeURIComponent(artist.name)}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50 hover:bg-accent"
              >
                {/* avatar */}
                <Avatar className="size-16 rounded-xl border border-border shrink-0">
                  {artist.imageUrl && (
                    <AvatarImage
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <User className="size-6" />
                  </AvatarFallback>
                </Avatar>

                {/* info */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition">
                    {artist.name}
                  </h3>

                  {artist.listeners && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" />
                      <span>{Number(artist.listeners).toLocaleString()} listeners</span>
                    </p>
                  )}
                </div>

                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* empty state */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="mt-14 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <User className="size-5" />
          </div>

          <p className="mt-4 text-sm font-medium">
            no artists found.
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            try searching for another artist name.
          </p>
        </div>
      )}
    </div>
  );
}
