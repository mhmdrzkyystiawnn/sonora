import type { LucideIcon } from "lucide-react";

export function CoverImage({
  imageUrl,
  name,
  fallback,
}: {
  imageUrl: string | null;
  name: string;
  fallback: LucideIcon;
}) {
  const Fallback = fallback;

  if (!imageUrl) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Fallback className="size-4" />
      </div>
    );
  }

  return (
    <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
      <img src={imageUrl} alt={name} className="size-full object-cover" />
    </div>
  );
}
