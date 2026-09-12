import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { SharedPlaylist as SharedPlaylistData } from "@sonora/shared";
import { Music2, ArrowLeft, ListMusic } from "lucide-react";
import { getSharedPlaylist } from "../api/library";
import { NotFoundError } from "../api/client";
import { Skeleton } from "@/components/ui/skeleton";

export function SharedPlaylist() {
  const { token } = useParams<{ token: string }>();

  const [playlist, setPlaylist] = useState<SharedPlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    getSharedPlaylist(token)
      .then((data) => {
        if (isMounted) setPlaylist(data);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(
            err instanceof NotFoundError
              ? "This playlist is not shared (or no longer exists)."
              : err instanceof Error
                ? err.message
                : "Failed to load playlist.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="py-8">
      <div className="mx-auto max-w-5xl px-4">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          <span>Back to home</span>
        </Link>

        {loading ? (
          <SharedPlaylistSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
              <ListMusic className="size-5" />
            </div>
            <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">
              Playlist unavailable
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {error}
            </p>
          </div>
        ) : playlist ? (
          <>
            <header className="mb-8">
              <p className="mb-2 text-xs uppercase tracking-widest text-primary">
                shared playlist
              </p>
              <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {playlist.description}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {playlist.tracks.length} track
                {playlist.tracks.length === 1 ? "" : "s"}
              </p>
            </header>

            <div className="border-t border-border/60">
              {playlist.tracks.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">
                  This playlist has no tracks yet.
                </p>
              ) : (
                playlist.tracks.map((track, index) => (
                  <Link
                    key={`${track.id}-${index}`}
                    to={`/music/${encodeURIComponent(track.artistName)}/${encodeURIComponent(track.name)}`}
                    className="group -mx-2 flex items-center gap-4 border-b border-border/60 px-2 py-3 transition hover:bg-foreground/[0.03]"
                  >
                    <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {track.imageUrl ? (
                        <img
                          src={track.imageUrl}
                          alt={track.name}
                          className="size-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <Music2 className="size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-foreground transition group-hover:text-primary">
                        {track.name}
                      </h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {track.artistName}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SharedPlaylistSkeleton() {
  return (
    <div>
      <Skeleton className="mb-2 h-3 w-28 rounded" />
      <Skeleton className="h-8 w-2/3 rounded" />
      <div className="mt-8 space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-3 w-5 rounded" />
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/2 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}