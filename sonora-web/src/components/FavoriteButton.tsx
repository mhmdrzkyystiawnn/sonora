import { Heart } from "lucide-react";
import type { AddFavoriteInput } from "../.../shared/index";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/auth";
import { useLibrary } from "../context/library";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  kind,
  name,
  artistName,
  imageUrl,
  url,
  mbid,
  className,
}: AddFavoriteInput & { className?: string }) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loading } = useLibrary();

  if (!user) {
    return null;
  }

  const active = isFavorite(kind, name, artistName);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("rounded-full", className)}
      disabled={loading}
      title={active ? "Remove from favorites" : "Add to favorites"}
      onClick={(event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleFavorite({ kind, name, artistName, imageUrl, url, mbid });
      }}
    >
      <Heart
        className={cn(
          "size-4 transition",
          active
            ? "fill-primary text-primary"
            : "text-muted-foreground hover:text-primary",
        )}
      />
    </Button>
  );
}