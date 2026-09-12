import { BellPlus, Bell } from "lucide-react";
import type { AddFollowInput } from "../.../shared/index";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/auth";
import { useFollow } from "../context/follow";
import { cn } from "@/lib/utils";

export function FollowButton({
  name,
  url,
  imageUrl,
  mbid,
  className,
}: AddFollowInput & { className?: string }) {
  const { user } = useAuth();
  const { isFollowing, toggleFollow, followsLoading } = useFollow();

  if (!user) {
    return null;
  }

  const active = isFollowing(name);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("rounded-full", className)}
      disabled={followsLoading}
      title={active ? "Unfollow artist" : "Follow artist for release updates"}
      onClick={(event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleFollow({ name, url, imageUrl, mbid });
      }}
    >
      {active ? (
        <Bell className="size-4 fill-primary text-primary" />
      ) : (
        <BellPlus className="size-4 text-muted-foreground hover:text-primary" />
      )}
    </Button>
  );
}