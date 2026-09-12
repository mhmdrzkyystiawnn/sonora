import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Music2, Loader2, Pencil, Trash2, Check, X, Share2, Download } from "lucide-react";
import type { PlaylistDetail as PlaylistDetailData } from "@sonora/shared";
import * as libraryApi from "../api/library";
import { NotFoundError } from "../api/client";
import { AddTrackSearch } from "../components/AddTrackSearch";
import { CoverImage } from "../components/CoverImage";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  return <PlaylistDetailInner key={id ?? ""} id={id ?? ""} />;
}

function PlaylistDetailInner({ id }: { id: string }) {
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<PlaylistDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchPlaylist = useCallback(async () => {
    const data = await libraryApi.getPlaylist(id);
    setPlaylist(data);
    setShared(data.isPublic);
    setError(null);
    return data;
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await fetchPlaylist();
        if (!isMounted) return;
        setPlaylist(data);
        setShared(data.isPublic);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof NotFoundError) {
          setError("Playlist not found.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load playlist.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [fetchPlaylist]);

  async function refreshDetail() {
    await fetchPlaylist();
  }

  async function removeTrack(trackId: string) {
    setError(null);
    try {
      await libraryApi.removePlaylistTrack(id, trackId);
      await refreshDetail();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove track.");
    }
  }

  function startEditing() {
    if (!playlist) return;
    setDraftName(playlist.name);
    setDraftDescription(playlist.description ?? "");
    setEditing(true);
  }

  async function save() {
    if (!playlist || !id) return;
    const name = draftName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      await libraryApi.updatePlaylist(id, {
        name,
        description: draftDescription.trim() || null,
      });
      setEditing(false);
      await refreshDetail();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save playlist.");
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (!playlist || !id) return;
    setBusy(true);
    try {
      if (shared) {
        await libraryApi.unsharePlaylist(id);
        setShared(false);
      } else {
        const result = await libraryApi.sharePlaylist(id);
        setShared(true);
        const url = `${window.location.origin}${result.url}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update sharing.");
    } finally {
      setBusy(false);
    }
  }

  function exportJson() {
    if (!playlist) return;
    const payload = {
      name: playlist.name,
      description: playlist.description,
      tracks: playlist.tracks.map((track) => ({
        name: track.name,
        artistName: track.artistName,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${playlist.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!playlist || !id) return;
    setBusy(true);
    setError(null);
    try {
      await libraryApi.deletePlaylist(id);
      navigate("/library");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete playlist.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <PlaylistDetailSkeleton />;
  }

  if (error && !playlist) {
    return (
      <div className="py-8">
        <div className="mx-auto max-w-5xl px-4">
          <Link
            to="/library"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Library</span>
          </Link>
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="py-8">
      <div className="mx-auto max-w-5xl px-4">
        <Link
          to="/library"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Library</span>
        </Link>

        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {editing ? (
              <div className="max-w-xl space-y-2">
                <input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-lg font-semibold outline-none transition focus:border-primary"
                />
                <textarea
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  rows={2}
                  placeholder="Description"
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground outline-none transition focus:border-primary"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving || !draftName.trim()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="size-3.5 animate-spin" />}
                    <Check className="size-3.5" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    <X className="size-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
                  {playlist.name}
                </h1>
                {playlist.description && (
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    {playlist.description}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {playlist.tracks.length} track{playlist.tracks.length === 1 ? "" : "s"}
                  {" · "}created {formatDate(playlist.createdAt)}
                  {shared && " · shared"}
                </p>
              </>
            )}
          </div>

          {!editing && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                title={shared ? "Shared. Click to stop sharing" : "Share playlist"}
                onClick={() => void handleShare()}
                disabled={busy}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                <Share2 className="size-4" />
                {shared ? (copied ? "Copied!" : "Public") : "Share"}
              </button>
              <button
                type="button"
                title="Export playlist as JSON"
                onClick={exportJson}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <Download className="size-4" />
                Export
              </button>
              <button
                type="button"
                title="Edit playlist"
                onClick={startEditing}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <Pencil className="size-4" />
                Edit
              </button>
              <button
                type="button"
                title="Delete playlist"
                onClick={() => void handleDelete()}
                disabled={busy}
                className="inline-flex h-9 items-center rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-sm font-semibold text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          )}
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="space-y-6">
          <div>
            <h2 className="mb-3 font-display text-lg font-bold tracking-tight text-foreground">
              Add tracks
            </h2>
            <AddTrackSearch playlistId={playlist.id} onAdded={refreshDetail} />
          </div>

          <div>
            <h2 className="mb-3 font-display text-lg font-bold tracking-tight text-foreground">
              Tracks
            </h2>
            {playlist.tracks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                  <Music2 className="size-4" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  No tracks yet. Search above to add your first song.
                </p>
              </div>
            ) : (
              <div className="border-t border-border/60">
                {playlist.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="group -mx-2 flex items-center gap-4 border-b border-border/60 px-2 py-3"
                  >
                    <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Link
                      to={`/music/${encodeURIComponent(track.artistName)}/${encodeURIComponent(track.name)}`}
                      className="flex min-w-0 flex-1 items-center gap-4"
                    >
                      <CoverImage imageUrl={track.imageUrl} name={track.name} fallback={Music2} />
                      <div className="min-w-0">
                        <h3 className="truncate font-medium text-foreground transition group-hover:text-primary">
                          {track.name}
                        </h3>
                        <p className="truncate text-sm text-muted-foreground">
                          {track.artistName}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      aria-label={`Remove ${track.name} from playlist`}
                      onClick={() => void removeTrack(track.id)}
                      className="rounded-full p-2 text-muted-foreground transition hover:text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function PlaylistDetailSkeleton() {
  return (
    <div className="py-8">
      <div className="mx-auto max-w-5xl px-4">
        <Skeleton className="mb-6 h-4 w-24 rounded" />
        <Skeleton className="h-9 w-2/3 rounded" />
        <Skeleton className="mt-3 h-4 w-1/3 rounded" />
        <Skeleton className="mt-8 h-10 w-full rounded-xl" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
