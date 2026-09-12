export const GENRES = [
  { tag: "rock", label: "Rock" },
  { tag: "pop", label: "Pop" },
  { tag: "jazz", label: "Jazz" },
  { tag: "lo-fi", label: "Lo-Fi" },
  { tag: "hip-hop", label: "Hip-Hop" },
  { tag: "indie", label: "Indie" },
  { tag: "electronic", label: "Electronic" },
  { tag: "city pop", label: "City Pop" },
] as const;

export type Genre = (typeof GENRES)[number];

export function isKnownGenre(tag: string): boolean {
  return GENRES.some((genre) => genre.tag === tag.toLowerCase());
}