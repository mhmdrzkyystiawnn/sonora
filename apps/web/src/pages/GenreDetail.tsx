import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ArtistSearchResult, GenreTracksResponse, Music } from "@sonora/shared";
import { GENRES } from "@sonora/shared";
import { ArrowLeft, Music2, ChevronLeft, ChevronRight, Loader2, SkipBack, SkipForward } from "lucide-react";
import { getGenreTracks, getGenreArtists } from "../api/genre";
import { AudioPreviewButton } from "../components/AudioPreviewButton";
import { ArtistSection } from "../components/ArtistSection";
import { Skeleton } from "@/components/ui/skeleton";

export function GenreDetail() {
  const { tag } = useParams<{ tag: string }>();

  if (!tag) {
    return null;
  }

  return <GenreDetailInner key={tag} tag={tag} />;
}

type TracksState = {
  data: Music[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function tracksFromResponse(response: GenreTracksResponse): TracksState {
  return {
    data: response.data,
    page: response.page,
    limit: response.limit,
    total: response.total,
    totalPages: response.totalPages,
  };
}

function GenreDetailInner({ tag }: { tag: string }) {
  const decodedTag = decodeURIComponent(tag);
  const genre = GENRES.find((g) => g.tag === decodedTag.toLowerCase());

  const [tracks, setTracks] = useState<TracksState>({
    data: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [artists, setArtists] = useState<ArtistSearchResult[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [tracksRes, artistsRes] = await Promise.all([
          getGenreTracks(decodedTag, 1),
          getGenreArtists(decodedTag),
        ]);
        if (!isMounted) return;
        setTracks(tracksFromResponse(tracksRes));
        setArtists(artistsRes);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "failed to load genre");
      } finally {
        if (isMounted) setTracksLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [decodedTag]);

  async function goToPage(nextPage: number) {
    setTracksLoading(true);
    setError(null);
    try {
      const response = await getGenreTracks(decodedTag, nextPage);
      setTracks(tracksFromResponse(response));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "failed to load tracks");
    } finally {
      setTracksLoading(false);
    }
  }

  return (
    <div className="py-8">
      <div className="mx-auto max-w-5xl px-4">
        <Link
          to="/genre"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          <span>All genres</span>
        </Link>

        <header className="mb-10">
          <p className="mb-2 text-xs uppercase tracking-widest text-primary">
            genre
          </p>
          <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            {genre?.label ?? decodedTag}
          </h1>
        </header>

        {tracksLoading && tracks.data.length === 0 ? (
          <GenreDetailSkeleton />
        ) : (
          <div className="space-y-16">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <section>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-5 w-[3px] rounded-full bg-primary" />
                <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                  Top Tracks
                </h2>
                {tracksLoading && (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
              </div>

              <div
                className={`grid grid-cols-3 gap-5 sm:grid-cols-4 ${
                  tracksLoading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {tracks.data.map((track, index) => (
                  <Link
                    key={`${track.url}-${(tracks.page - 1) * tracks.limit + index}`}
                    to={`/music/${encodeURIComponent(track.artist)}/${encodeURIComponent(track.title)}`}
                    className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/40"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {track.imageUrl ? (
                        <img
                          src={track.imageUrl}
                          alt={track.title}
                          className="size-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <Music2 className="size-8" />
                        </div>
                      )}

                      <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium tabular-nums text-white backdrop-blur-sm">
                        {(tracks.page - 1) * tracks.limit + index + 1}
                      </span>

                      <AudioPreviewButton
                        src={track.previewUrl}
                        label={track.title}
                        className="absolute bottom-2.5 right-2.5 rounded-full bg-white/90 p-2 text-zinc-900 shadow transition hover:bg-primary hover:text-primary-foreground"
                      />
                    </div>

                    <div className="p-3">
                      <h3 className="truncate font-medium text-foreground visited:text-foreground transition group-hover:text-primary">
                        {track.title}
                      </h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {track.artist}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <Pagination
                page={tracks.page}
                pageCount={tracks.totalPages}
                onChange={(nextPage) => void goToPage(nextPage)}
              />
            </section>

            <ArtistSection title="Top Artists" artists={artists} />
          </div>
        )}
      </div>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const baseButton =
    "inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-muted disabled:opacity-40";

  if (pageCount > 7) {
    return (
      <div className="mt-6 flex items-center justify-center gap-1.5">
        <button
          type="button"
          aria-label="First page"
          onClick={() => onChange(1)}
          disabled={page === 1}
          className={baseButton}
        >
          <SkipBack className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={baseButton}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-24 px-2 text-center text-sm font-medium tabular-nums text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          aria-label="Next page"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
          className={baseButton}
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Last page"
          onClick={() => onChange(pageCount)}
          disabled={page === pageCount}
          className={baseButton}
        >
          <SkipForward className="size-4" />
        </button>
      </div>
    );
  }

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={baseButton}
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onChange(number)}
          aria-current={number === page ? "page" : undefined}
          className={`inline-flex size-9 items-center justify-center rounded-lg text-sm font-medium transition ${
            number === page
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        aria-label="Next page"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        className={baseButton}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function GenreDetailSkeleton() {
  return (
    <div className="space-y-16">
      <section>
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-5 w-0.75 rounded-full" />
          <Skeleton className="h-6 w-32 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-5 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border/60">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="space-y-1.5 p-3">
                <Skeleton className="h-3.5 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-5 w-0.75 rounded-full" />
          <Skeleton className="h-6 w-32 rounded" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-40 shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}