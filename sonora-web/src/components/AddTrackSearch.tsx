import { useEffect, useRef, useState } from "react";
import { Loader2, Music2, Plus, Search } from "lucide-react";
import type { Music } from "../.../shared/index";
import * as libraryApi from "../api/library";
import { searchMusic } from "../api/music";
import { CoverImage } from "./CoverImage";

export function AddTrackSearch({
  playlistId,
  onAdded,
}: {
  playlistId: string;
  onAdded: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Music[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUrl, setAddingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchKeyRef = useRef(0);

  useEffect(() => {
    const value = query.trim();
    if (!value) return;
    const timer = setTimeout(() => void runSearch(value), 400);
    return () => clearTimeout(timer);
  }, [query]);

  async function runSearch(value: string) {
    const key = ++searchKeyRef.current;
    setSearching(true);
    setError(null);
    try {
      const data = await searchMusic(value);
      if (key === searchKeyRef.current) setResults(data);
    } catch (err: unknown) {
      if (key === searchKeyRef.current) {
        setError(err instanceof Error ? err.message : "Search failed.");
      }
    } finally {
      if (key === searchKeyRef.current) setSearching(false);
    }
  }

  async function add(track: Music) {
    setAddingUrl(track.url);
    setError(null);
    try {
      await libraryApi.addPlaylistTrack(playlistId, {
        name: track.title,
        artistName: track.artist,
        imageUrl: track.imageUrl ?? null,
        url: track.url ?? null,
        mbid: null,
      });
      setQuery("");
      setResults([]);
      await onAdded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add track.");
    } finally {
      setAddingUrl(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 focus-within:border-primary">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (!value.trim()) setResults([]);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") void runSearch(query);
            if (event.key === "Escape") {
              setQuery("");
              setResults([]);
            }
          }}
          placeholder="Search a song to add…"
          className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {searching && <Loader2 className="size-4 shrink-0 animate-spin text-primary" />}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {results.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-1.5">
          {results.slice(0, 5).map((track) => (
            <div
              key={track.url}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-foreground/[0.03]"
            >
              <CoverImage imageUrl={track.imageUrl ?? null} name={track.title} fallback={Music2} />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-medium text-foreground">
                  {track.title}
                </h4>
                <p className="truncate text-xs text-muted-foreground">
                  {track.artist}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Add ${track.title} to playlist`}
                onClick={() => void add(track)}
                disabled={addingUrl === track.url}
                className="rounded-full p-2 text-muted-foreground transition hover:text-primary disabled:opacity-50"
              >
                {addingUrl === track.url ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
