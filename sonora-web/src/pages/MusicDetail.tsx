import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import type { Music, TrackDetail } from "../shared/index";
import {
  Music2,
  ExternalLink,
  ArrowLeft,
  Users,
  Play,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getTrack, getSimilarTracks } from "../api/music";
import * as libraryApi from "../api/library";
import { NotFoundError } from "../api/client";
import { useAuth } from "../context/auth";
import { FavoriteButton } from "../components/FavoriteButton";
import { AddToPlaylistButton } from "../components/AddToPlaylistButton";
import { AudioPreviewButton } from "../components/AudioPreviewButton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function formatDuration(milliseconds?: string) {
  if (!milliseconds) return null;

  const totalSeconds = Math.round(Number(milliseconds) / 1000);

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function SimilarTracksSkeleton() {
  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-5 w-0.75 rounded-full bg-primary" />
        <Skeleton className="h-6 w-36 rounded" />
      </div>
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
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
    </section>
  );
}

function SimilarTracksError({ message }: { message: string }) {
  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-5 w-0.75 rounded-full bg-primary" />
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          Similar Tracks
        </h2>
      </div>
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {message}
      </div>
    </section>
  );
}

function SimilarTracksSection({
  tracks,
  isLoading,
  error,
}: {
  tracks: Music[];
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) return <SimilarTracksSkeleton />;
  if (error) return <SimilarTracksError message={error} />;
  if (tracks.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-5 w-0.75 rounded-full bg-primary" />
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          Similar Tracks
        </h2>
      </div>

      <div className="border-t border-border/60">
        {tracks.map((track, index) => (
          <Link
            key={`${track.url}-${index}`}
            to={`/music/${encodeURIComponent(track.artist)}/${encodeURIComponent(track.title)}`}
            className="group -mx-2 flex items-center gap-4 border-b border-border/60 px-2 py-3 transition hover:bg-foreground/[0.03]"
          >
            <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
              {track.imageUrl ? (
                <img
                  src={track.imageUrl}
                  alt={track.title}
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
                {track.title}
              </h3>
              <p className="truncate text-sm text-muted-foreground">
                {track.artist}
              </p>
            </div>
            <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MusicDetail() {
  const { artist, track } = useParams<{ artist: string; track: string }>();
  const { user } = useAuth();
  const [trackData, setTrackData] = useState<TrackDetail | null>(null);
  const [similarTracks, setSimilarTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [similarError, setSimilarError] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const loggedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!artist || !track) return;

    const decodedArtist = decodeURIComponent(artist);
    const decodedTrack = decodeURIComponent(track);

    let isMounted = true;

    async function fetchData() {
      try {
        const data = await getTrack(decodedArtist, decodedTrack);

        if (isMounted) {
          setTrackData(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [artist, track]);

  useEffect(() => {
    if (!trackData || !user) return;
    if (loggedUrlRef.current === trackData.url) return;

    loggedUrlRef.current = trackData.url;
    void libraryApi.logHistory({
      kind: "track",
      name: trackData.title,
      artistName: trackData.artist,
      imageUrl: trackData.imageUrl ?? null,
      url: trackData.url,
    });
  }, [trackData, user]);

  useEffect(() => {
    if (!artist || !track) return;

    const decodedArtist = decodeURIComponent(artist);
    const decodedTrack = decodeURIComponent(track);

    let isMounted = true;

    getSimilarTracks(decodedArtist, decodedTrack)
      .then((data) => {
        if (isMounted) setSimilarTracks(data);
      })
      .catch((err) => {
        if (isMounted) setSimilarError(err.message);
      })
      .finally(() => {
        if (isMounted) setSimilarLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [artist, track]);

  if (loading) {
    return <MusicDetailSkeleton />;
  }

  if (error) {
    if (
      error instanceof NotFoundError ||
      (error as { status?: number }).status === 404
    ) {
      return <TrackNotFound artist={artist || ""} track={track || ""} />;
    }
    return (
      <div className="py-8">
        <div className="mx-auto max-w-5xl px-4">
          <Link
            to="/music"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            <span>Back to search</span>
          </Link>
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertTitle className="font-bold">Error loading track</AlertTitle>
            <AlertDescription>{error.message || "An error occurred."}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!trackData) {
    return <TrackNotFound artist={artist || ""} track={track || ""} />;
  }

  const duration = formatDuration(trackData.duration);

  return (
    <div className="py-8">
      <div className="mx-auto max-w-5xl px-4">
        <Link
          to="/music"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          <span>Back to search</span>
        </Link>

        <header className="mb-10 flex items-start gap-5">
          <div className="relative size-30 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-2xl shadow-black/40">
            {trackData.imageUrl ? (
              <img
                src={trackData.imageUrl}
                alt={trackData.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Music2 className="size-10" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs uppercase tracking-widest text-primary">
              {trackData.album ?? "track"}
            </p>
            <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
              {trackData.title}
            </h1>
            <Link
              to={`/artist/${encodeURIComponent(trackData.artist)}`}
              className="mt-2 inline-block text-lg text-muted-foreground transition hover:text-primary"
            >
              {trackData.artist}
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {trackData.listeners && (
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {Number(trackData.listeners).toLocaleString()} listeners
                </span>
              )}
              {trackData.playCount && (
                <span className="flex items-center gap-1">
                  <Play className="size-3.5" />
                  {Number(trackData.playCount).toLocaleString()} plays
                </span>
              )}
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {duration}
                </span>
              )}
            </div>

            <div className="mt-5 flex items-center gap-3">
              <AudioPreviewButton
                src={trackData.previewUrl}
                label={trackData.title}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-primary hover:text-primary-foreground"
              >
                <span>Preview</span>
              </AudioPreviewButton>
              <a
                href={trackData.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <ExternalLink className="size-4" />
                Listen on Last.fm
              </a>
              <FavoriteButton
                kind="track"
                name={trackData.title}
                artistName={trackData.artist}
                imageUrl={trackData.imageUrl}
                url={trackData.url}
              />
              <AddToPlaylistButton
                track={{
                  name: trackData.title,
                  artistName: trackData.artist,
                  imageUrl: trackData.imageUrl ?? null,
                  url: trackData.url ?? null,
                  mbid: null,
                }}
              />
            </div>
          </div>
        </header>

        {trackData.tags && trackData.tags.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {trackData.tags.map((tag) => (
              <a
                key={tag.name}
                href={tag.url}
                target="_blank"
                rel="noreferrer"
                className="transition hover:scale-105"
              >
                <Badge className="bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground text-xs">
                  {tag.name}
                </Badge>
              </a>
            ))}
          </div>
        )}

        {trackData.summary && (
          <section className="mb-12 max-w-3xl">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="h-5 w-0.75 rounded-full bg-primary" />
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                About this track
              </h2>
            </div>

            <Collapsible
              open={isSummaryExpanded}
              onOpenChange={setIsSummaryExpanded}
              className="space-y-3"
            >
              <p className="font-sans text-sm leading-relaxed text-muted-foreground">
                {trackData.summary}
              </p>

              {trackData.summary.length > 400 && (
                <CollapsibleTrigger className="flex items-center gap-1.5 font-sans text-xs font-semibold text-primary transition hover:text-primary/80">
                  {isSummaryExpanded ? (
                    <>
                      Read less <ChevronUp className="size-3.5" />
                    </>
                  ) : (
                    <>
                      Read full summary <ChevronDown className="size-3.5" />
                    </>
                  )}
                </CollapsibleTrigger>
              )}
            </Collapsible>
          </section>
        )}

        <SimilarTracksSection
          tracks={similarTracks}
          isLoading={similarLoading}
          error={similarError}
        />
      </div>
    </div>
  );
}

function TrackNotFound({ artist, track }: { artist: string; track: string }) {
  return (
    <div className="py-12">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-muted-foreground">
          <Music2 className="size-7" />
        </div>

        <h1 className="mt-5 font-display text-2xl tracking-tight text-foreground">
          Track not found
        </h1>

        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          We couldn't find "{decodeURIComponent(track)}" by{" "}
          {decodeURIComponent(artist)} on Last.fm. Please verify the name and
          try again.
        </p>

        <Link
          to="/music"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Back to Search
        </Link>
      </div>
    </div>
  );
}

function MusicDetailSkeleton() {
  return (
    <div className="py-8">
      <div className="mx-auto max-w-5xl px-4">
        <Skeleton className="mb-6 h-4 w-28 rounded" />

        <div className="mb-10 flex items-start gap-5">
          <Skeleton className="size-30 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-8 w-2/3 rounded" />
            <Skeleton className="h-5 w-1/3 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>

        <div className="mb-10 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-14 rounded-full" />
          ))}
        </div>

        <section>
          <div className="mb-4 flex items-center gap-2.5">
            <Skeleton className="h-5 w-0.75 rounded-full" />
            <Skeleton className="h-5 w-36 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-11/12 rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
        </section>
      </div>
    </div>
  );
}