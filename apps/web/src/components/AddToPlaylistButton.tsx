import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListPlus, Loader2, Plus } from "lucide-react";
import type { AddPlaylistTrackInput, Playlist } from "@sonora/shared";
import { useAuth } from "../context/auth";
import * as libraryApi from "../api/library";
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

export function AddToPlaylistButton({
  track,
  className,
}: {
  track: AddPlaylistTrackInput;
  className?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    libraryApi
      .getPlaylists()
      .then((data) => {
        if (isMounted) setPlaylists(data);
      })
      .catch((err: unknown) => {
        if (isMounted)
          setError(err instanceof Error ? err.message : "Failed to load playlists.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [open]);

  async function addTo(playlist: Playlist) {
    setBusyId(playlist.id);
    setError(null);
    try {
      await libraryApi.addPlaylistTrack(playlist.id, track);
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add track.");
    } finally {
      setBusyId(null);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setLoading(true);
          setError(null);
        }}
        className={
          className ??
          "inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
        }
      >
        <ListPlus className="size-4" />
        Add to playlist
      </button>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>Add to playlist</DialogTitle>
          <DialogDescription>
            Choose a playlist to save this track to.
          </DialogDescription>

          <div className="mt-5 max-h-72 space-y-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  You don't have any playlists yet.
                </p>
                <Link
                  to="/library"
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary/80"
                >
                  <Plus className="size-3.5" />
                  Create one in Library
                </Link>
              </div>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  disabled={busyId === playlist.id}
                  onClick={() => void addTo(playlist)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 text-left transition hover:border-primary/50 hover:bg-accent disabled:opacity-60"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <ListPlus className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {playlist.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {playlist.trackCount} track
                      {playlist.trackCount === 1 ? "" : "s"}
                    </span>
                  </span>
                  {busyId === playlist.id && (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  )}
                </button>
              ))
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end">
            <DialogClose className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted">
              Close
            </DialogClose>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}