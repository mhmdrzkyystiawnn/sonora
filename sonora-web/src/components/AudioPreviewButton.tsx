import { Play, Square } from "lucide-react";
import { useAudioPlayer } from "../context/audio";

type AudioPreviewButtonProps = {
  src?: string;
  label: string;
  className?: string;
  children?: React.ReactNode;
};

export function AudioPreviewButton({
  src,
  label,
  className,
  children,
}: AudioPreviewButtonProps) {
  const { playingKey, toggle } = useAudioPlayer();

  if (!src) {
    return null;
  }

  const previewSrc: string = src;
  const isPlaying = playingKey === previewSrc;

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggle(previewSrc, previewSrc);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isPlaying ? `Pause preview of ${label}` : `Play preview of ${label}`}
      title={isPlaying ? "Pause preview" : "Preview 30 seconds"}
      className={className}
    >
      {isPlaying ? (
        <Square className="size-4 fill-current" />
      ) : (
        <Play className="size-4 fill-current" />
      )}
      {children}
    </button>
  );
}