import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  ArtistSearchResult,
  MoodResponse,
  Music,
  Recommendation,
} from "@sonora/shared";
import {
  Music2,
  Play,
  Sparkles,
  Loader2,
  Save,
} from "lucide-react";
import { getPopularTracks, getPopularArtists } from "../api/discovery";
import { getForYou, getMoodPlaylist } from "../api/recommendation";
import * as libraryApi from "../api/library";
import { useAuth } from "../context/auth";
import { AudioPreviewButton } from "../components/AudioPreviewButton";
import { ArtistSection } from "../components/ArtistSection";
import { Skeleton } from "@/components/ui/skeleton";

export function Discovery() {
  const { user } = useAuth();

  return (
    <div className="py-12 sm:py-20">
      <header className="max-w-3xl mb-16 sm:mb-24">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-primary">
          discovery
        </p>
        <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
          discover what's trending.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          explore popular tracks and trending artists around the globe.
        </p>
      </header>

      <div className="space-y-20 sm:space-y-28">
        {user ? <RecommendedForYouSection /> : null}
        {user ? <MoodSection /> : null}
        <PopularTracksSection />
        <PopularArtistsSection />
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="h-5 w-[3px] rounded-full bg-primary" />
      <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {children}
      </h2>
    </div>
  );
}

function TrackSkeleton() {
  return (
    <section>
      <SectionHeading>Popular Tracks</SectionHeading>
      <div className="mb-10 grid items-center gap-8 sm:grid-cols-[280px_1fr]">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-10 w-3/4 rounded" />
          <Skeleton className="h-5 w-1/3 rounded" />
        </div>
      </div>
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            <Skeleton className="size-12 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrackError({ message }: { message: string }) {
  return (
    <section>
      <SectionHeading>Popular Tracks</SectionHeading>
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {message}
      </div>
    </section>
  );
}

function PopularTracksSection() {
  const [tracks, setTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getPopularTracks()
      .then((data) => {
        if (isMounted) {
          setTracks(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <TrackSkeleton />;
  }

  if (error) {
    return <TrackError message={error} />;
  }

  const featured = tracks.length > 0 ? tracks[0] : null;
  const restTracks = tracks.length > 1 ? tracks.slice(1) : [];

  return (
    <section>
      <SectionHeading>Popular Tracks</SectionHeading>

      {featured ? (
        <Link
          to={`/music/${encodeURIComponent(featured.artist)}/${encodeURIComponent(featured.title)}`}
          className="group mb-10 grid gap-6 sm:grid-cols-[280px_1fr] sm:items-center sm:gap-10"
        >
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-2xl shadow-black/40">
            {featured?.imageUrl ? (
              <img
                src={featured?.imageUrl}
                alt={featured?.title}
                className="size-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <Music2 className="size-10" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
              <div className="flex size-14 scale-90 items-center justify-center rounded-full bg-background/90 opacity-0 backdrop-blur transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                <Play className="ml-0.5 size-6 fill-primary text-primary" />
              </div>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-primary">
              editorial pick
            </p>
            <h3 className="font-display text-3xl leading-tight text-foreground transition group-hover:text-primary sm:text-4xl">
              {featured?.title}
            </h3>
            <p className="mt-3 text-lg text-muted-foreground">{featured?.artist}</p>
          </div>
        </Link>
      ) : null}

      <div className="border-t border-border/60">
        {restTracks.map((music, index) => (
         <Link 
            key={`${music.url}-${index}`}
            to={`/music/${encodeURIComponent(music.artist)}/${encodeURIComponent(music.title)}`}
            className="group -mx-2 flex items-center gap-4 border-b border-border/60 px-2 py-4 transition hover:bg-foreground/[0.03]"
          >
            <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
              {String(index + 2).padStart(2, "0")}
            </span>
            <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
              {music.imageUrl ? (
                <img
                  src={music.imageUrl}
                  alt={music.title}
                  className="size-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Music2 className="size-4" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-medium text-foreground transition group-hover:text-primary">
                {music.title}
              </h4>
              <p className="truncate text-sm text-muted-foreground">{music.artist}</p>
            </div>
            <AudioPreviewButton
              src={music.previewUrl}
              label={music.title}
              className="rounded-lg bg-primary/10 p-2.5 text-primary transition hover:bg-primary hover:text-primary-foreground"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

function PopularArtistsSection() {
  const [artists, setArtists] = useState<ArtistSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getPopularArtists()
      .then((data) => {
        if (isMounted) {
          setArtists(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ArtistSection
      title="Popular Artists"
      artists={artists}
      isLoading={loading}
      error={error}
    />
  );
}

function RecommendedForYouSection() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [source, setSource] = useState<"ai" | "lastfm" | "empty">("empty");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getForYou()
      .then((data) => {
        if (isMounted) {
          setRecommendations(data.data);
          setSource(data.source);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ArtistSection
      title="Recommended for You"
      artists={recommendations}
      isLoading={loading}
      overlayClassName="bg-gradient-to-t from-black/85 via-black/10 to-transparent"
      renderSubtitle={(recommendation) =>
        source === "ai" ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-white/70">
            {recommendation.reason}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-white/70">similar artists</p>
        )
      }
      footer={
        source === "ai" ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            curated with AI based on your favorites and listening history.
          </p>
        ) : null
      }
    />
  );
}

function MoodSection() {
  const [mood, setMood] = useState("");
  const [result, setResult] = useState<MoodResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit() {
    const value = mood.trim();

    if (!value || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const response = await getMoodPlaylist(value);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build mood playlist.");
    } finally {
      setLoading(false);
    }
  }

  async function saveToLibrary() {
    if (!result || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const playlist = await libraryApi.createPlaylist({
        name: `Mood: ${result.mood}`,
      });

      for (const track of result.data) {
        await libraryApi.addPlaylistTrack(playlist.id, {
          name: track.name,
          artistName: track.artistName ?? "Unknown",
        });
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save playlist.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <SectionHeading>Mood Mixes</SectionHeading>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="mb-8 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="text"
          value={mood}
          onChange={(event) => setMood(event.target.value)}
          placeholder="lagi galau, buat nugas, road trip vibes…"
          maxLength={200}
          className="min-w-0 flex-1 rounded-xl border border-border/60 bg-card/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || mood.trim().length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          <span>{loading ? "Building…" : "Build mix"}</span>
        </button>
      </form>

      {error ? (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="size-11 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : result && result.data.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              {result.source === "ai"
                ? `picked with AI for "${result.mood}".`
                : `based on popular picks for "${result.mood}".`}
            </p>
            <button
              type="button"
              disabled={saving || saved}
              onClick={() => void saveToLibrary()}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>{saved ? "Saved to library" : "Save as playlist"}</span>
            </button>
          </div>

          <div className="border-t border-border/60">
            {result.data.map((track, index) => (
              <Link
                key={`${track.name}-${track.artistName}-${index}`}
                to={`/music/${encodeURIComponent(track.artistName ?? "")}/${encodeURIComponent(track.name)}`}
                className="group -mx-2 flex items-center gap-4 border-b border-border/60 px-2 py-3 transition hover:bg-foreground/[0.03]"
              >
                <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="size-11 shrink-0 overflow-hidden rounded-md bg-muted">
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
                  <h4 className="truncate font-medium text-foreground transition group-hover:text-primary">
                    {track.name}
                  </h4>
                  <p className="truncate text-sm text-muted-foreground">
                    {track.artistName}
                  </p>
                  {result.source === "ai" && track.reason ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-primary/80">
                      {track.reason}
                    </p>
                  ) : null}
                </div>
                <AudioPreviewButton
                  src={track.previewUrl}
                  label={track.name}
                  className="rounded-lg bg-primary/10 p-2.5 text-primary transition hover:bg-primary hover:text-primary-foreground"
                />
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}