import { normalizeListingImages, safeImageUrl, type ListingImage } from "./listing-images";
import { sanitizeSourceText } from "./source-text";

export interface QualifiedListingCandidate {
  url: string;
  title: string;
  snippet?: string;
  possiblePrice?: string;
  thumbnailUrl?: string;
  sourceName?: string;
  sourceDomain?: string;
}

export interface ListingEnrichmentResult {
  sourceUrl: string;
  title?: string;
  imageUrls?: string[];
  primaryImage?: ListingImage;
  galleryImages?: ListingImage[];
  itemPrice?: number;
  currency?: string;
  priceLabel?: string;
  availability?: string;
  condition?: string;
  sellerName?: string;
  locationLabel?: string;
  extractionMethod:
    | "structured-api"
    | "search-rich-result"
    | "json-ld-offer"
    | "open-graph"
    | "microdata"
    | "meta-tag"
    | "embedded-product-json"
    | "source-specific-parser"
    | "none";
  confidence: number;
  extractedAt: string;
  rejectionReasons?: string[];
}

export interface SourceMetadataAdapter {
  supports(url: string): boolean;
  enrich(url: string, options?: EnrichmentOptions): Promise<ListingEnrichmentResult>;
}

export interface SourceEnrichmentPolicy {
  domain: string;
  allowMetadataFetch: boolean;
  allowJsonLdExtraction: boolean;
  allowOpenGraphExtraction: boolean;
  allowEmbeddedProductJson: boolean;
  adapterName?: string;
}

export interface ExtractedPrice {
  value?: number;
  currency?: string;
  confidence: number;
  method: "structured-api" | "search-rich-result" | "json-ld-offer" | "microdata" | "meta-tag" | "embedded-product-json" | "open-graph" | "source-adapter" | "none";
  label?: string;
  rejectionReason?: string;
}

export type MetadataFetcher = (input: string, init: RequestInit) => Promise<Response>;

export interface EnrichmentOptions {
  fetcher?: MetadataFetcher;
  now?: number;
  forceRefresh?: boolean;
}

interface CachedEnrichment {
  expiresAt: number;
  result: ListingEnrichmentResult;
}

const enrichmentCache = new Map<string, CachedEnrichment>();

export const sourceEnrichmentPolicies: SourceEnrichmentPolicy[] = [
  { domain: "reverb.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true, adapterName: "reverb" },
  { domain: "ebay.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "wildwoodguitars.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "ish.guitars", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "chicagomusicexchange.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "sweetwater.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "guitarcenter.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "musiciansfriend.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "zzounds.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "americanmusical.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "thomannmusic.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "andertons.co.uk", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "ishibashi.co.jp", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "mattsmusic.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "theaxepalace.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "gasstationguitars.com", allowMetadataFetch: true, allowJsonLdExtraction: true, allowOpenGraphExtraction: true, allowEmbeddedProductJson: true },
  { domain: "rvb-img.reverb.com", allowMetadataFetch: false, allowJsonLdExtraction: false, allowOpenGraphExtraction: false, allowEmbeddedProductJson: false },
  { domain: "images.reverb.com", allowMetadataFetch: false, allowJsonLdExtraction: false, allowOpenGraphExtraction: false, allowEmbeddedProductJson: false }
];

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9$.,]+/g, " ").trim();
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "unknown";
  }
}

function policyForUrl(url: string) {
  const domain = domainFromUrl(url);
  return sourceEnrichmentPolicies.find(policy => domain === policy.domain || domain.endsWith(`.${policy.domain}`));
}

function ttlMs() {
  return Number(process.env.LISTING_ENRICHMENT_CACHE_TTL_SECONDS || 900) * 1000;
}

export function clearListingEnrichmentCache() {
  enrichmentCache.clear();
}

export function formatPriceLabel(value: number, currency = "USD") {
  if (currency.toUpperCase() === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  }
  return `${currency.toUpperCase()} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

function parsePriceValue(value: unknown) {
  if (typeof value === "number") return value;
  const match = String(value ?? "").replace(/,/g, "").match(/(?:US\s*)?\$?\s*(\d{3,6})(?:\.\d{1,2})?/i);
  return match ? Number(match[1]) : undefined;
}

function priceLooksSane(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) && value >= 100 && value <= 100_000;
}

function priceRejectionReason(text: string) {
  const value = normalize(text);
  if (/\b(price guide|value guide|valuation|worth around|worth about|estimated value|estimate)\b/.test(value)) return "price-guide-value";
  if (/\b(sold for|sold at|sold last|historical|ended at|previously sold)\b/.test(value)) return "historical-price";
  if (/\b(month|monthly|per month|financing|affirm|klarna|afterpay)\b/.test(value)) return "financing-payment";
  if (/\b(msrp|list price|retail price|was price|compare at)\b/.test(value)) return "msrp-or-reference-price";
  if (/\b(shipping|ships for|postage|delivery)\b/.test(value) && !/\b(price|asking|for sale|fs|obo|buy now)\b/.test(value)) return "shipping-only-price";
  if (/\b(discussion|forum valuation|what is it worth|buyers guide)\b/.test(value)) return "discussion-price";
  return undefined;
}

function hasSaleIntent(text: string) {
  return /\b(price|asking|for sale|fs\b|obo|shipped|paypal|buy now|in stock|add to cart|used|new)\b/i.test(text);
}

export function extractPriceFromText(text: string, method: ExtractedPrice["method"]): ExtractedPrice {
  const rejectionReason = priceRejectionReason(text);
  if (rejectionReason) return { confidence: 0, method: "none", rejectionReason };
  if (!hasSaleIntent(text)) return { confidence: 0, method: "none", rejectionReason: "low-confidence-price" };
  const value = parsePriceValue(text);
  if (!priceLooksSane(value)) return { confidence: 0, method: "none", rejectionReason: "low-confidence-price" };
  const safeValue = value as number;
  const currency = /\b(?:cad|gbp|eur|jpy)\b/i.exec(text)?.[0]?.toUpperCase() || "USD";
  return {
    value: safeValue,
    currency,
    confidence: method === "search-rich-result" ? 0.86 : 0.9,
    method,
    label: formatPriceLabel(safeValue, currency)
  };
}

function extractMicrodataPrice(html: string): ExtractedPrice {
  const price = html.match(/itemprop=["']price["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/itemprop=["']price["'][^>]*>\s*([^<]+)/i)?.[1];
  const currency = html.match(/itemprop=["']priceCurrency["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? "USD";
  const value = parsePriceValue(price);
  if (!priceLooksSane(value)) return { confidence: 0, method: "none", rejectionReason: "low-confidence-price" };
  return { value, currency, method: "microdata", confidence: 0.9, label: formatPriceLabel(value as number, currency) };
}

function extractMetaPrice(html: string): ExtractedPrice {
  const meta = (property: string) => {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"))
      ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"));
    return match?.[1];
  };
  const price = meta("product:price:amount") ?? meta("og:price:amount") ?? meta("twitter:data1");
  const currency = meta("product:price:currency") ?? meta("og:price:currency") ?? "USD";
  const value = parsePriceValue(price);
  if (!priceLooksSane(value)) return { confidence: 0, method: "none", rejectionReason: "low-confidence-price" };
  return { value, currency, method: "meta-tag", confidence: 0.9, label: formatPriceLabel(value as number, currency) };
}

function extractEmbeddedProductMetadata(html: string, sourceUrl: string, now = Date.now()): ListingEnrichmentResult {
  const priceMatch = html.match(/"price"\s*:\s*"?(\d{3,8})(?:\.\d{1,2})?"?/i)
    ?? html.match(/"amount"\s*:\s*"?(\d{3,8})(?:\.\d{1,2})?"?/i);
  const currency = html.match(/"currency"\s*:\s*"([A-Z]{3})"/i)?.[1] ?? "USD";
  const rawPrice = priceMatch?.[1] ? Number(priceMatch[1]) : undefined;
  const itemPrice = rawPrice && rawPrice > 100_000 ? rawPrice / 100 : rawPrice;
  const imageMatches = Array.from(html.matchAll(/"((?:https?:\/\/|\/\/)[^"]*(?:cdn\.shopify|wp-content|woocommerce|images?|cdn)[^"]*)"/gi))
    .map(match => match[1].startsWith("//") ? `https:${match[1]}` : match[1]);
  const images = normalizeListingImages(imageMatches.map(url => ({ url, source: "embedded-product-json" as const, alt: "Listing image", fit: "contain" as const })), "Listing image");
  const hasPrice = priceLooksSane(itemPrice);
  return {
    sourceUrl,
    imageUrls: images.map(image => image.url).filter((url): url is string => Boolean(url)),
    primaryImage: images[0],
    galleryImages: images,
    itemPrice: hasPrice ? itemPrice : undefined,
    currency,
    priceLabel: hasPrice ? formatPriceLabel(itemPrice as number, currency) : undefined,
    extractionMethod: hasPrice ? "embedded-product-json" : images.length ? "embedded-product-json" : "none",
    confidence: hasPrice ? 0.88 : images.length ? 0.55 : 0,
    extractedAt: new Date(now).toISOString(),
    rejectionReasons: hasPrice ? [] : ["low-confidence-price"]
  };
}

function typeIncludes(value: unknown, expected: string) {
  const values = Array.isArray(value) ? value : [value];
  return values.some(item => normalize(item).split(" ").includes(expected.toLowerCase()));
}

function arrayOf<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function scriptJsonLdBlocks(html: string) {
  return Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
    .map(match => decodeHtmlEntities(match[1] ?? "").trim())
    .filter(Boolean);
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return [record, ...flattenJsonLd(record["@graph"]), ...flattenJsonLd(record.offers)];
}

function imagesFromJsonLdValue(value: unknown): string[] {
  return arrayOf(value).flatMap(item => {
    if (typeof item === "string") return [item];
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return [record.url, record.contentUrl].filter((entry): entry is string => typeof entry === "string");
    }
    return [];
  });
}

function offerPrice(offer: Record<string, unknown>) {
  const price = parsePriceValue(offer.price ?? offer.lowPrice ?? offer.highPrice);
  const currency = String(offer.priceCurrency || "USD").toUpperCase();
  if (!priceLooksSane(price)) return undefined;
  return { value: price, currency };
}

export function extractJsonLdListingMetadata(html: string, sourceUrl: string, now = Date.now()): ListingEnrichmentResult {
  const reasons: string[] = [];
  const blocks = scriptJsonLdBlocks(html);
  const records = blocks.flatMap(block => {
    try {
      return flattenJsonLd(JSON.parse(block));
    } catch {
      reasons.push("malformed-json-ld");
      return [];
    }
  });

  const product = records.find(record => typeIncludes(record["@type"], "product"));
  const offer = records.find(record => typeIncludes(record["@type"], "offer") || typeIncludes(record["@type"], "aggregateoffer"));
  const price = offer ? offerPrice(offer) : undefined;
  const productImages = product ? imagesFromJsonLdValue(product.image) : [];
  const title = typeof product?.name === "string" ? product.name : undefined;
  const images = normalizeListingImages(productImages.map(url => ({ url, source: "json-ld" as const, alt: title || "Listing image", fit: "contain" as const })), title || "Listing image");

  if (!offer) reasons.push("missing-offer");
  if (offer && !price) reasons.push("low-confidence-price");

  return {
    sourceUrl,
    title,
    imageUrls: images.map(image => image.url).filter((url): url is string => Boolean(url)),
    primaryImage: images[0],
    galleryImages: images,
    itemPrice: price?.value,
    currency: price?.currency,
    priceLabel: price && price.value !== undefined ? formatPriceLabel(price.value, price.currency) : undefined,
    availability: typeof offer?.availability === "string" ? offer.availability.split("/").pop() : undefined,
    condition: typeof offer?.itemCondition === "string" ? offer.itemCondition.split("/").pop() : undefined,
    extractionMethod: price ? "json-ld-offer" : "none",
    confidence: price ? 0.94 : 0,
    extractedAt: new Date(now).toISOString(),
    rejectionReasons: reasons
  };
}

function extractOpenGraph(html: string, sourceUrl: string, now = Date.now()): ListingEnrichmentResult {
  const meta = (property: string) => {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"))
      ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i"));
    return match?.[1];
  };
  const title = meta("og:title");
  const imageUrl = safeImageUrl(meta("og:image"));
  const twitterImageUrl = safeImageUrl(meta("twitter:image"));
  const price = extractMetaPrice(html);
  const currency = meta("product:price:currency") || price.currency || "USD";
  const images = normalizeListingImages([
    { url: imageUrl, source: "open-graph" as const, alt: title || "Listing image", fit: "cover" as const },
    { url: twitterImageUrl, source: "twitter-card" as const, alt: title || "Listing image", fit: "cover" as const }
  ], title || "Listing image");

  return {
    sourceUrl,
    title,
    imageUrls: images.map(image => image.url).filter((url): url is string => Boolean(url)),
    primaryImage: images[0],
    galleryImages: images,
    itemPrice: price.confidence >= 0.85 ? price.value : undefined,
    currency,
    priceLabel: price.confidence >= 0.85 && price.value ? formatPriceLabel(price.value, currency) : undefined,
    extractionMethod: price.confidence >= 0.85 ? "meta-tag" : images.length ? "open-graph" : "none",
    confidence: price.confidence >= 0.85 ? price.confidence : images.length ? 0.55 : 0,
    extractedAt: new Date(now).toISOString(),
    rejectionReasons: price.rejectionReason ? [price.rejectionReason] : []
  };
}

export function isReverbItemPage(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if (host !== "reverb.com") return false;
    if (/\/(?:marketplace|price-guide|news|articles|shop|page)\b/.test(path)) return false;
    return /^\/item\/\d+/.test(path);
  } catch {
    return false;
  }
}

export class ReverbMetadataAdapter implements SourceMetadataAdapter {
  supports(url: string) {
    return isReverbItemPage(url);
  }

  async enrich(url: string, options: EnrichmentOptions = {}) {
    if (!this.supports(url)) {
      return emptyEnrichment(url, options.now, ["metadata-fetch-not-permitted"]);
    }
    return enrichFromPage(url, options, "source-specific-parser");
  }
}

function emptyEnrichment(sourceUrl: string, now = Date.now(), reasons: string[] = []): ListingEnrichmentResult {
  return {
    sourceUrl,
    extractionMethod: "none",
    confidence: 0,
    extractedAt: new Date(now).toISOString(),
    rejectionReasons: reasons
  };
}

async function enrichFromPage(sourceUrl: string, options: EnrichmentOptions, preferredMethod: ListingEnrichmentResult["extractionMethod"], policy?: SourceEnrichmentPolicy): Promise<ListingEnrichmentResult> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(sourceUrl, {
    headers: { Accept: "text/html,application/xhtml+xml" },
    redirect: "follow"
  });
  if (!response.ok) return emptyEnrichment(sourceUrl, options.now, ["metadata-fetch-failed"]);
  const contentType = response.headers.get("content-type") || "";
  if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    return emptyEnrichment(sourceUrl, options.now, ["metadata-fetch-not-html"]);
  }
  const html = await response.text();
  const jsonLd = policy?.allowJsonLdExtraction === false ? emptyEnrichment(sourceUrl, options.now, ["json-ld-extraction-not-permitted"]) : extractJsonLdListingMetadata(html, sourceUrl, options.now);
  const openGraph = policy?.allowOpenGraphExtraction === false ? emptyEnrichment(sourceUrl, options.now, ["open-graph-extraction-not-permitted"]) : extractOpenGraph(html, sourceUrl, options.now);
  const microdata = priceResultToEnrichment(extractMicrodataPrice(html), sourceUrl, options.now);
  const embedded = policy?.allowEmbeddedProductJson === false ? emptyEnrichment(sourceUrl, options.now, ["embedded-product-json-not-permitted"]) : extractEmbeddedProductMetadata(html, sourceUrl, options.now);
  const bestImages = normalizeListingImages([...(jsonLd.galleryImages ?? []), ...(openGraph.galleryImages ?? []), ...(embedded.galleryImages ?? [])], jsonLd.title || openGraph.title || "Listing image");
  const best = [jsonLd, openGraph, microdata, embedded].sort((a, b) => b.confidence - a.confidence)[0] ?? jsonLd;
  const extractionMethod: ListingEnrichmentResult["extractionMethod"] = best.extractionMethod === "json-ld-offer"
    ? "json-ld-offer"
    : preferredMethod === "source-specific-parser" && best.confidence > 0
      ? "source-specific-parser"
      : best.extractionMethod;

  return {
    ...best,
    title: best.title || openGraph.title,
    imageUrls: bestImages.map(image => image.url).filter((url): url is string => Boolean(url)),
    primaryImage: bestImages[0],
    galleryImages: bestImages,
    extractionMethod,
    rejectionReasons: [...(jsonLd.rejectionReasons ?? []), ...(openGraph.rejectionReasons ?? []), ...(microdata.rejectionReasons ?? []), ...(embedded.rejectionReasons ?? [])]
  };
}

function priceResultToEnrichment(price: ExtractedPrice, sourceUrl: string, now = Date.now()): ListingEnrichmentResult {
  return {
    sourceUrl,
    itemPrice: price.confidence >= 0.85 ? price.value : undefined,
    currency: price.currency,
    priceLabel: price.confidence >= 0.85 && price.value ? formatPriceLabel(price.value, price.currency) : undefined,
    extractionMethod: price.confidence >= 0.85 ? price.method as ListingEnrichmentResult["extractionMethod"] : "none",
    confidence: price.confidence,
    extractedAt: new Date(now).toISOString(),
    rejectionReasons: price.rejectionReason ? [price.rejectionReason] : []
  };
}

const adapters: SourceMetadataAdapter[] = [new ReverbMetadataAdapter()];

export async function enrichListingMetadata(candidate: QualifiedListingCandidate, options: EnrichmentOptions = {}): Promise<ListingEnrichmentResult> {
  const now = options.now ?? Date.now();
  const cacheKey = candidate.url;
  const cached = enrichmentCache.get(cacheKey);
  if (!options.forceRefresh && cached && cached.expiresAt > now) return cached.result;

  const searchPrice = extractPriceFromText(`${candidate.title} ${candidate.snippet ?? ""} ${candidate.possiblePrice ?? ""}`, "search-rich-result");
  const searchImages = normalizeListingImages([
    { url: candidate.thumbnailUrl, source: "search-thumbnail" as const, alt: candidate.title, fit: "cover" as const }
  ], candidate.title);
  let result: ListingEnrichmentResult = {
    sourceUrl: candidate.url,
    title: candidate.title,
    imageUrls: searchImages.map(image => image.url).filter((url): url is string => Boolean(url)),
    primaryImage: searchImages[0],
    galleryImages: searchImages,
    itemPrice: searchPrice.confidence >= 0.85 ? searchPrice.value : undefined,
    currency: searchPrice.currency,
    priceLabel: searchPrice.confidence >= 0.85 && searchPrice.value ? formatPriceLabel(searchPrice.value, searchPrice.currency) : undefined,
    extractionMethod: searchPrice.confidence >= 0.85 ? "search-rich-result" : "none",
    confidence: searchPrice.confidence >= 0.85 ? searchPrice.confidence : searchImages.length ? 0.45 : 0,
    extractedAt: new Date(now).toISOString(),
    rejectionReasons: searchPrice.rejectionReason ? [searchPrice.rejectionReason] : []
  };

  const policy = policyForUrl(candidate.url);
  const adapter = adapters.find(item => item.supports(candidate.url));
  if (policy?.allowMetadataFetch) {
    const pageResult = await (adapter
      ? adapter.enrich(candidate.url, options)
      : enrichFromPage(candidate.url, options, "open-graph", policy)
    ).catch(() => emptyEnrichment(candidate.url, now, [adapter ? "source-specific-parser-error" : "metadata-fetch-error"]));
    result = mergeEnrichment(result, pageResult);
  } else if (!policy?.allowMetadataFetch) {
    result.rejectionReasons = [...(result.rejectionReasons ?? []), "metadata-fetch-not-permitted"];
  }

  enrichmentCache.set(cacheKey, { expiresAt: now + ttlMs(), result });
  return result;
}

function mergeEnrichment(base: ListingEnrichmentResult, page: ListingEnrichmentResult): ListingEnrichmentResult {
  const images = normalizeListingImages([...(page.galleryImages ?? []), ...(base.galleryImages ?? [])], page.title || base.title || "Listing image");
  const usePagePrice = page.itemPrice !== undefined && page.confidence >= 0.85;
  const useBasePrice = base.itemPrice !== undefined && base.confidence >= 0.85;
  return {
    ...base,
    ...page,
    title: page.title || base.title,
    itemPrice: usePagePrice ? page.itemPrice : useBasePrice ? base.itemPrice : undefined,
    currency: usePagePrice ? page.currency : base.currency,
    priceLabel: usePagePrice ? page.priceLabel : useBasePrice ? base.priceLabel : undefined,
    extractionMethod: usePagePrice ? page.extractionMethod : useBasePrice ? base.extractionMethod : images.length ? page.extractionMethod : "none",
    confidence: Math.max(base.confidence, page.confidence),
    imageUrls: images.map(image => image.url).filter((url): url is string => Boolean(url)),
    primaryImage: images[0],
    galleryImages: images,
    rejectionReasons: [...(base.rejectionReasons ?? []), ...(page.rejectionReasons ?? [])]
  };
}
