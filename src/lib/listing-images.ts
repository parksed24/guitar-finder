export type ListingImageSource =
  | "structured-api"
  | "json-ld"
  | "open-graph"
  | "twitter-card"
  | "embedded-product-json"
  | "search-thumbnail"
  | "source-adapter"
  | "placeholder";

export interface ListingImage {
  url?: string;
  source: ListingImageSource;
  alt: string;
  isSourceBacked: boolean;
  validationStatus: "unchecked" | "valid" | "invalid" | "blocked" | "expired";
  fit?: "cover" | "contain";
}

const privateHostPatterns = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/i
];

const obviousHtmlPageExtensions = /\.(?:html?|php|aspx?|jsp)(?:[?#].*)?$/i;

export function safeImageUrl(value: string | undefined) {
  if (!value) return undefined;
  try {
    const trimmed = value.trim();
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return undefined;
    if (privateHostPatterns.some(pattern => pattern.test(url.hostname.toLowerCase()))) return undefined;
    const path = `${url.pathname}${url.search}`.toLowerCase();
    if (/(pixel|spacer|beacon|tracking|transparent|1x1)/i.test(path)) return undefined;
    if (obviousHtmlPageExtensions.test(path)) return undefined;
    return trimmed;
  } catch {
    return undefined;
  }
}

export function normalizeListingImages(images: Array<Partial<ListingImage> | string | undefined>, fallbackAlt: string): ListingImage[] {
  const seen = new Set<string>();
  const normalized: ListingImage[] = [];

  for (const image of images) {
    const input = typeof image === "string" ? { url: image, source: "search-thumbnail" as ListingImageSource } : image;
    const url = safeImageUrl(input?.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    normalized.push({
      url,
      source: input?.source ?? "search-thumbnail",
      alt: input?.alt || fallbackAlt,
      isSourceBacked: input?.isSourceBacked ?? true,
      validationStatus: "unchecked",
      fit: input?.fit ?? "cover"
    });
  }

  return normalized;
}

export function placeholderImage(sourceName: string, title = "Listing image unavailable"): ListingImage {
  return {
    source: "placeholder",
    alt: `${sourceName || title} placeholder`,
    isSourceBacked: false,
    validationStatus: "blocked",
    fit: "contain"
  };
}
