import { Link } from "react-router-dom";
import { GENRES } from "@sonora/shared";
import { Tags } from "lucide-react";

export function GenreBrowse() {
  return (
    <div className="py-12 sm:py-16">
      <header className="max-w-3xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          genre browsing
        </p>

        <h1 className="font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
          pick a vibe.
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          browse top tracks and artists by genre — no need to know a specific
          name to start exploring.
        </p>
      </header>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {GENRES.map((genre) => (
          <Link
            key={genre.tag}
            to={`/genre/${encodeURIComponent(genre.tag)}`}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:bg-accent"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
              <Tags className="size-4" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              {genre.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}