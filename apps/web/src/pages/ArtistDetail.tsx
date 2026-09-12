import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import type { Artist, ArtistSearchResult, Music } from "@sonora/shared";
import {
  Users,
  User,
  Music2,
  ExternalLink,
  ArrowLeft,
  Play,
  ChevronDown,
  ChevronUp,
  } from "lucide-react";
import { getArtist, getArtistTopTracks, getSimilarArtists } from "../api/artist";
import * as libraryApi from "../api/library";
import { NotFoundError } from "../api/client";
import { useAuth } from "../context/auth";
import { FavoriteButton } from "../components/FavoriteButton";
import { FollowButton } from "../components/FollowButton";
import { ArtistSection } from "../components/ArtistSection";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function getArtistInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// duration display not available in current schema - keeping for future enhancement
// function formatDuration(seconds?: number): string { ... }

export function ArtistDetail() {
  const { name } = useParams<{ name: string }>();
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [topTracks, setTopTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [similarArtists, setSimilarArtists] = useState<ArtistSearchResult[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [similarError, setSimilarError] = useState<string | null>(null);
  const loggedNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!name) return;

    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
    });

    async function fetchData() {
      try {
        const decodedName = decodeURIComponent(name || "");
        const [artistData, tracksData] = await Promise.all([
          getArtist(decodedName),
          getArtistTopTracks(decodedName),
        ]);

        if (isMounted) {
          setArtist(artistData);
          setTopTracks(tracksData);
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
  }, [name]);

  useEffect(() => {
    if (!artist || !user) return;
    if (loggedNameRef.current === artist.name) return;

    loggedNameRef.current = artist.name;
    void libraryApi.logHistory({
      kind: "artist",
      name: artist.name,
      imageUrl: artist.imageUrl ?? null,
      url: artist.url,
    });
  }, [artist, user]);

  useEffect(() => {
    if (!name) return;
    let isMounted = true;

    getSimilarArtists(decodeURIComponent(name))
      .then((data) => {
        if (isMounted) setSimilarArtists(data);
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
  }, [name]);

  if (loading) {
    return <ArtistDetailSkeleton />;
  }

  if (error) {
    if (
      error instanceof NotFoundError ||
      (error as { status?: number }).status === 404
    ) {
      return <ArtistNotFound name={name || ""} />;
    }
    return (
      <div className="py-8">
        <div className="max-w-5xl mx-auto px-4">
          <Link
            to="/artists"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            <span>Back to search</span>
          </Link>
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertTitle className="font-bold">Error loading artist</AlertTitle>
            <AlertDescription>{error.message || "An error occurred."}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!artist) {
    return <ArtistNotFound name={name || ""} />;
  }

  return (
    <div className="py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* back button */}
        <Link
          to="/artists"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          <span>Back to search</span>
        </Link>

        {/* hero section */}
        <header className="flex items-center gap-5 mb-10">
          <Avatar className="size-30">
            {artist.imageUrl && (
              <AvatarImage
                src={artist.imageUrl}
                alt={artist.name}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-muted text-muted-foreground font-sans text-lg font-semibold">
              {getArtistInitials(artist.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              {artist.name}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {artist.listeners && (
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {Number(artist.listeners).toLocaleString()} listeners
                </span>
              )}
              {artist.playcount && (
                <span className="flex items-center gap-1">
                  <Play className="size-3.5" />
                  {Number(artist.playcount).toLocaleString()} plays
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FollowButton
              name={artist.name}
              url={artist.url}
              imageUrl={artist.imageUrl}
            />
            <FavoriteButton
              kind="artist"
              name={artist.name}
              imageUrl={artist.imageUrl}
              url={artist.url}
            />
          </div>
        </header>

        {/* tags */}
        {artist.tags && artist.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {artist.tags.map((tag) => (
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

        {/* 2-column grid: Biography (left) + Top Tracks (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* left column: biography + stats */}
          <div className="lg:col-span-5 space-y-8">
            {/* biography */}
            {artist.bio && (artist.bio.content || artist.bio.summary) && (
              <section>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="h-5 w-0.75 rounded-full bg-primary" />
                  <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                    Biography
                  </h2>
                </div>

                <Collapsible
                  open={isBioExpanded}
                  onOpenChange={setIsBioExpanded}
                  className="space-y-3"
                >
                  <div className="font-sans text-sm leading-relaxed text-muted-foreground">
                    {isBioExpanded
                      ? artist.bio.content || artist.bio.summary
                      : artist.bio.summary}
                  </div>

                  {artist.bio.content && artist.bio.content.length > 200 && (
                    <CollapsibleTrigger className="flex items-center gap-1.5 font-sans text-xs font-semibold text-primary transition hover:text-primary/80">
                      {isBioExpanded ? (
                        <>
                          Read less <ChevronUp className="size-3.5" />
                        </>
                      ) : (
                        <>
                          Read full biography <ChevronDown className="size-3.5" />
                        </>
                      )}
                    </CollapsibleTrigger>
                  )}
                </Collapsible>
              </section>
            )}
          </div>

          {/* right column: top tracks */}
          <div className="lg:col-span-7">
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="h-5 w-0.75 rounded-full bg-primary" />
                <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
                  Top Tracks
                </h2>
              </div>

              <div className="space-y-1">
                {topTracks.map((track, index) => (
                  <a
                    key={`${track.title}-${index}`}
                    href={track.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-3 p-2 rounded-lg transition-colors hover:bg-accent/40"
                  >
                    {/* left: number + cover + info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground group-hover:text-primary transition">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {track.imageUrl ? (
                          <img
                            src={track.imageUrl}
                            alt={track.title}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <Music2 className="size-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-sans text-sm font-medium text-foreground group-hover:text-primary transition">
                          {track.title}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    {/* right: action */}
                    <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Similar Artists — loaded independently, does not block page */}
        <ArtistSection
          title="Similar Artists"
          artists={similarArtists}
          isLoading={similarLoading}
          error={similarError}
          className="mt-12"
        />
      </div>
    </div>
  );
}

function ArtistNotFound({ name }: { name: string }) {
  return (
    <div className="py-12">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-muted-foreground">
          <User className="size-7" />
        </div>

        <h1 className="mt-5 font-display text-2xl tracking-tight text-foreground">
          Artist not found
        </h1>

        <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
          We couldn't find an artist named "{decodeURIComponent(name)}" on Last.fm. Please verify the name and try again.
        </p>

        <Link
          to="/artists"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Back to Search
        </Link>
      </div>
    </div>
  );
}

function ArtistDetailSkeleton() {
  return (
    <div className="py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* back button */}
        <Skeleton className="mb-6 h-4 w-28 rounded" />

        {/* hero */}
        <div className="flex items-center gap-5 mb-10">
          <Skeleton className="size-20 rounded-2xl shrink-0" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-8 w-2/3 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
        </div>

        {/* tags */}
        <div className="flex gap-2 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-14 rounded-full" />
          ))}
        </div>

        {/* 2-column content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* left column */}
          <div className="lg:col-span-5 space-y-8">
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <Skeleton className="h-5 w-0.75 rounded-full" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-11/12 rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
            </section>
          </div>

          {/* right column */}
          <div className="lg:col-span-7">
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <Skeleton className="h-5 w-0.75 rounded-full" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
              <div className="space-y-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton className="w-5 h-3 rounded" />
                      <Skeleton className="size-10 rounded-md shrink-0" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-2/3 rounded" />
                        <Skeleton className="h-2.5 w-1/3 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-3.5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
