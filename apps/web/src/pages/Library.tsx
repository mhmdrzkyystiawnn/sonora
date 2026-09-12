import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Music2,
  User,
  ListMusic,
  Heart,
  Clock,
  Plus,
  Trash2,
  Play,
  Bell,
  Sparkles,
  Loader2,
  ChevronRight,
} from "lucide-react";
import type {
  Favorite,
  HistoryEntry,
  Playlist,
} from "@sonora/shared";
import * as libraryApi from "../api/library";
import { getPlaylistDraft } from "../api/recommendation";
import { useLibrary } from "../context/library";
import { useFollow } from "../context/follow";
import { Skeleton } from "@/components/ui/skeleton";
import { CoverImage } from "../components/CoverImage";
import {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

type Tab = "favorites" | "playlists" | "history" | "following";

const tabs: { id: Tab; label: string; icon: typeof Heart }[] = [
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "history", label: "History", icon: Clock },
  { id: "following", label: "Following", icon: Bell },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function favoriteHref(favorite: Favorite): string {
  if (favorite.kind === "track") {
    return `/music/${encodeURIComponent(favorite.artistName ?? "")}/${encodeURIComponent(favorite.name)}`;
  }
  return `/artist/${encodeURIComponent(favorite.name)}`;
}

function historyHref(entry: HistoryEntry): string {
  if (entry.kind === "track") {
    return `/music/${encodeURIComponent(entry.artistName ?? "")}/${encodeURIComponent(entry.name)}`;
  }
  return `/artist/${encodeURIComponent(entry.name)}`;
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
        <Heart className="size-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function FavoritesTab() {
  const { favorites, loading, toggleFavorite } = useLibrary();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2.5">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3 rounded" />
              <Skeleton className="h-3 w-1/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        title="No favorites yet"
        description="Tap the heart on any track or artist you like and they'll show up here."
      />
    );
  }

  return (
    <div className="border-t border-border/60">
      {favorites.map((favorite) => (
        <div
          key={favorite.id}
          className="group -mx-2 flex items-center gap-4 border-b border-border/60 px-2 py-3"
        >
          <Link
            to={favoriteHref(favorite)}
            className="flex min-w-0 flex-1 items-center gap-4"
          >
            <CoverImage
              imageUrl={favorite.imageUrl}
              name={favorite.name}
              fallback={favorite.kind === "track" ? Music2 : User}
            />
            <div className="min-w-0">
              <h3 className="truncate font-medium text-foreground transition group-hover:text-primary">
                {favorite.name}
              </h3>
              <p className="truncate text-sm text-muted-foreground">
                {favorite.kind === "track" ? favorite.artistName : "Artist"}
              </p>
            </div>
          </Link>
          <button
            type="button"
            aria-label={`Remove ${favorite.name} from favorites`}
            onClick={() => void toggleFavorite({
              kind: favorite.kind,
              name: favorite.name,
              artistName: favorite.artistName,
              imageUrl: favorite.imageUrl,
              url: favorite.url,
              mbid: favorite.mbid,
            })}
            className="rounded-full p-2 text-muted-foreground transition hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function PlaylistRow({ playlist }: { playlist: Playlist }) {
  return (
    <div className="border-b border-border/60">
      <Link
        to={`/playlist/${playlist.id}`}
        className="group -mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition hover:bg-foreground/[0.03]"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <ListMusic className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground transition group-hover:text-primary">
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className="truncate text-sm text-muted-foreground">
              {playlist.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {playlist.trackCount} track{playlist.trackCount === 1 ? "" : "s"}
            {playlist.isPublic && " · public"}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      </Link>
    </div>
  );
}

function CreatePlaylistModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, description: string | null) => Promise<void>;
}) {
  const [prompt, setPrompt] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPrompt("");
    setName("");
    setDescription("");
    setRewriting(false);
    setCreating(false);
    setError(null);
  }

  async function rewrite() {
    const value = prompt.trim();
    if (!value || rewriting) return;
    setRewriting(true);
    setError(null);
    try {
      const draft = await getPlaylistDraft(value);
      setName(draft.name);
      setDescription(draft.description);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to rewrite with AI.");
    } finally {
      setRewriting(false);
    }
  }

  async function create() {
    const finalName = name.trim();
    if (!finalName || creating) return;
    setCreating(true);
    setError(null);
    try {
      await onCreate(finalName, description.trim() || null);
      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create playlist.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <DialogRoot
      open={open}
      onOpenChange={(next) => {
        if (next) reset();
        onOpenChange(next);
      }}
    >
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>New playlist</DialogTitle>
          <DialogDescription>
            Describe what you want and let AI craft a name &amp; description.
          </DialogDescription>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="playlist-prompt"
                className="text-sm font-medium text-foreground"
              >
                Describe your playlist
              </label>
              <textarea
                id="playlist-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                placeholder="e.g. chill lofi beats for a rainy sunday afternoon"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
              <button
                type="button"
                onClick={() => void rewrite()}
                disabled={!prompt.trim() || rewriting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rewriting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5 text-primary" />
                )}
                {rewriting ? "Rewriting…" : "Rewrite with AI"}
              </button>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="playlist-name"
                className="text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="playlist-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Playlist name"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="playlist-description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="playlist-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="What's this playlist about?"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <DialogClose
                className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Cancel
              </DialogClose>
              <button
                type="button"
                onClick={() => void create()}
                disabled={!name.trim() || creating}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating && <Loader2 className="size-4 animate-spin" />}
                Create playlist
              </button>
            </div>
          </div>
        </DialogPopup>
      </DialogPortal>
    </DialogRoot>
  );
}

function PlaylistsTab() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    libraryApi
      .getPlaylists()
      .then((data) => {
        if (isMounted) setPlaylists(data);
      })
      .catch(() => {
        if (isMounted) setError("Failed to load playlists.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreate(name: string, description: string | null) {
    const playlist = await libraryApi.createPlaylist({ name, description });
    setPlaylists((prev) => [playlist, ...prev]);
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2.5">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3 rounded" />
              <Skeleton className="h-3 w-1/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          Playlists
        </h2>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" />
          New
        </button>
      </div>

      <CreatePlaylistModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {playlists.length === 0 ? (
        <EmptyState
          title="No playlists yet"
          description="Create your first playlist with the New button, then add tracks from any track page."
        />
      ) : (
        <div className="border-t border-border/60">
          {playlists.map((playlist) => (
            <PlaylistRow key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryTab() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    libraryApi
      .getHistory()
      .then((data) => {
        if (isMounted) setHistory(data);
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
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2.5">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3 rounded" />
              <Skeleton className="h-3 w-1/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <EmptyState
        title="No listening history yet"
        description="Tracks and artists you open will be logged here so you can find them again."
      />
    );
  }

  return (
    <div className="border-t border-border/60">
      {history.map((entry) => (
        <Link
          key={`${entry.key}-${entry.createdAt}`}
          to={historyHref(entry)}
          className="group -mx-2 flex items-center gap-4 border-b border-border/60 px-2 py-3"
        >
          <CoverImage
            imageUrl={entry.imageUrl}
            name={entry.name}
            fallback={entry.kind === "track" ? Music2 : User}
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-foreground transition group-hover:text-primary">
              {entry.name}
            </h3>
            <p className="truncate text-sm text-muted-foreground">
              {entry.kind === "track" ? entry.artistName : "Artist"}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Play className="size-3" />
              {formatDate(entry.createdAt)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function FollowingTab() {
  const { follows, followsLoading, toggleFollow } = useFollow();

  if (followsLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2.5">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/3 rounded" />
              <Skeleton className="h-3 w-1/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (follows.length === 0) {
    return (
      <EmptyState
        title="No artists followed yet"
        description="Follow artists to get notified when they release new albums."
      />
    );
  }

  return (
    <div className="border-t border-border/60">
      {follows.map((follow) => (
        <div
          key={follow.id}
          className="group -mx-2 flex items-center gap-4 border-b border-border/60 px-2 py-3"
        >
          <Link
            to={`/artist/${encodeURIComponent(follow.name)}`}
            className="flex min-w-0 flex-1 items-center gap-4"
          >
            <CoverImage
              imageUrl={follow.imageUrl ?? null}
              name={follow.name}
              fallback={User}
            />
            <div className="min-w-0">
              <h3 className="truncate font-medium text-foreground transition group-hover:text-primary">
                {follow.name}
              </h3>
              <p className="truncate text-sm text-muted-foreground">
                Followed {formatDate(follow.createdAt)}
              </p>
            </div>
          </Link>
          <button
            type="button"
            aria-label={`Unfollow ${follow.name}`}
            onClick={() =>
              void toggleFollow({
                name: follow.name,
                url: follow.url,
                imageUrl: follow.imageUrl,
                mbid: follow.mbid,
              })
            }
            className="rounded-full p-2 text-muted-foreground transition hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Library() {
  const [activeTab, setActiveTab] = useState<Tab>("favorites");

  return (
    <div className="py-8">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-widest text-primary">
            personal
          </p>
          <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            My Library
          </h1>
        </header>

        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card/40 p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "favorites" && <FavoritesTab />}
        {activeTab === "playlists" && <PlaylistsTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "following" && <FollowingTab />}
      </div>
    </div>
  );
}