import { Link } from "react-router-dom";
import { User, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ArtistSectionItem = {
  name: string;
  imageUrl?: string | null;
  listeners?: string;
};

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

export function ArtistSection<T extends ArtistSectionItem>({
  title,
  artists,
  isLoading = false,
  error = null,
  className,
  overlayClassName = "bg-gradient-to-t from-black/80 via-black/10 to-transparent",
  footer,
  renderSubtitle,
}: {
  title: string;
  artists: T[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  overlayClassName?: string;
  footer?: React.ReactNode;
  renderSubtitle?: (item: T) => React.ReactNode;
}) {
  if (isLoading) {
    return (
      <section className={className}>
        <SectionHeading>{title}</SectionHeading>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-40 shrink-0 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={className}>
        <SectionHeading>{title}</SectionHeading>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </section>
    );
  }

  if (artists.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <SectionHeading>{title}</SectionHeading>
      <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {artists.map((artist) => (
          <Link
            key={artist.name}
            to={`/artist/${encodeURIComponent(artist.name)}`}
            className="group relative aspect-[3/4] w-40 shrink-0 snap-start overflow-hidden rounded-2xl bg-muted"
          >
            {artist.imageUrl ? (
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <User className="size-8" />
              </div>
            )}
            <div className={`absolute inset-0 ${overlayClassName}`} />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <h4 className="truncate font-medium text-white">
                {artist.name}
              </h4>
              {renderSubtitle ? (
                renderSubtitle(artist)
              ) : artist.listeners ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-white/70">
                  <Users className="size-3" />
                  <span>{Number(artist.listeners).toLocaleString()}</span>
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  );
}