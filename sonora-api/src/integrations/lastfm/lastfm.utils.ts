const LASTFM_PLACEHOLDER_HASH =
  "2a96cbd8b46e442fc41c2b86b821562f";

export function isLastFmPlaceholder(url?: string) {
  if (!url) return true;

  return url.includes(LASTFM_PLACEHOLDER_HASH);
}

export function getLastFmImageUrl(
  images?: Array<{
    "#text": string;
    size: string;
  }>,
) {
  if (!images) return undefined;

  const preferredSizes = [
    "extralarge",
    "large",
    "medium",
    "small",
  ];

  for (const size of preferredSizes) {
    const image = images.find(
      (item) =>
        item.size === size &&
        item["#text"] &&
        !isLastFmPlaceholder(item["#text"]),
    );

    if (image?.["#text"]) {
      return image["#text"];
    }
  }

  return undefined;
}