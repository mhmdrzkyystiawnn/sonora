import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Stats as StatsData } from "../shared/index";
import { Heart, ListMusic, Sparkles, TrendingUp } from "lucide-react";
import { getStats } from "../api/stats";
import { Skeleton } from "@/components/ui/skeleton";

export function Stats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getStats()
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch(() => {
        if (isMounted) setStats(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-5xl px-4">
          <Skeleton className="mb-2 h-3 w-24 rounded" />
          <Skeleton className="h-8 w-56 rounded" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-5xl px-4">
          <h1 className="font-display text-3xl tracking-tight text-foreground">
            Your stats
          </h1>
          <p className="mt-3 text-muted-foreground">
            Sign in to see your listening stats.
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Saved items", value: stats.totalFavorites, icon: Heart },
    {
      label: "Discovered",
      value: stats.totalListens,
      icon: ListMusic,
    },
    { label: "This month", value: stats.listensThisMonth, icon: TrendingUp },
  ];

  const maxArtists = Math.max(1, ...stats.topArtists.map((a) => a.count));
  const maxTracks = Math.max(1, ...stats.topTracks.map((t) => t.count));

  return (
    <div className="py-8">
      <div className="mx-auto max-w-5xl px-4">
        <p className="mb-2 text-xs uppercase tracking-widest text-primary">
          listening
        </p>
        <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
          Your stats
        </h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border/60 bg-card/40 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {card.label}
                </p>
                <card.icon className="size-4 text-primary" />
              </div>
              <p className="mt-3 font-display text-4xl font-bold tabular-nums text-foreground">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <h2 className="mb-5 font-display text-lg font-semibold text-foreground">
              Top artists
            </h2>
            {stats.topArtists.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Save some tracks to see your top artists.
              </p>
            ) : (
              <ol className="space-y-3">
                {stats.topArtists.map((artist, index) => (
                  <li key={artist.name} className="flex items-center gap-3">
                    <span className="w-5 text-sm tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <Link
                          to={`/artist/${encodeURIComponent(artist.name)}`}
                          className="truncate font-medium text-foreground transition hover:text-primary"
                        >
                          {artist.name}
                        </Link>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {artist.count}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{
                            width: `${(artist.count / maxArtists) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <div className="mb-5 flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Top saved tracks
              </h2>
              <Sparkles className="size-4 text-muted-foreground" />
            </div>
            {stats.topTracks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Save some tracks to see your top tracks.
              </p>
            ) : (
              <ol className="space-y-3">
                {stats.topTracks.map((track, index) => (
                  <li key={`${track.name}-${track.artistName}`} className="flex items-center gap-3">
                    <span className="w-5 text-sm tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-medium text-foreground">
                          {track.name}
                        </span>
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {track.count}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {track.artistName}
                      </p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{
                            width: `${(track.count / maxTracks) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}