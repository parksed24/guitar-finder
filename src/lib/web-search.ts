import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { uiCopy } from "../content/ui-copy";
import { clearListingEnrichmentCache, enrichListingMetadata, extractPriceFromText, type ListingEnrichmentResult } from "./listing-enrichment";
import type { ListingImage } from "./listing-images";
import { defaultSourceAdapters, parsedSearchToCanonical, sourceListingToWebResult } from "./source-adapters";
import {
  assessListingAvailability,
  displayNameForUrl,
  isMarketplaceItemUrlByRegistry,
  isSearchOrLandingUrl,
  recordSourceDiscoveryCandidate,
  sourceForUrl,
  sourceTypeForListingUrl,
  targetedSearchScopes
} from "./source-registry";

export type WebMatchConfidence = "Likely exact match" | "Possible exact match";

export type UnifiedSourceType =
  | "retailer"
  | "boutique"
  | "marketplace"
  | "classified"
  | "forum-classified"
  | "international-retailer";

export interface ParsedGuitarSearch {
  originalQuery: string;
  brand?: string;
  model?: string;
  family?: string;
  tier?: string;
  series?: string;
  variant?: string;
  finish?: string;
  year?: number;
  strings?: number;
  artistSignature?: string;
  requiredTerms: string[];
  exclusionTerms: string[];
  requiredConcepts?: string[];
  preferredConcepts?: string[];
  excludeTerms?: string[];
}

export interface CanonicalSearchQuery {
  brand?: string;
  model?: string;
  family?: string;
  finish?: string;
  requiredConcepts: string[];
  preferredConcepts: string[];
  excludeTerms: string[];
}

export interface BraveWebResult {
  title?: string;
  url?: string;
  description?: string;
  profile?: {
    name?: string;
  };
  thumbnail?: {
    src?: string;
  };
  meta_url?: {
    hostname?: string;
  };
}

export interface WebSearchResult {
  id: string;
  title: string;
  url: string;
  sourceDomain: string;
  sourceName?: string;
  sourceType: UnifiedSourceType;
  snippet?: string;
  possiblePrice?: string;
  itemPrice?: number;
  currency?: string;
  priceLabel?: string;
  possibleLocation?: string;
  availability?: string;
  condition?: string;
  sellerName?: string;
  confidence: WebMatchConfidence;
  exactMatchConfidence: number;
  buyabilityScore: number;
  freshnessStatus: "recently-checked" | "availability-unverified" | "possibly-stale";
  extractionMethod: "structured-source" | "search-api" | "permitted-page-metadata";
  isPurchasablePage: boolean;
  availabilityWarning?: string;
  thumbnailUrl?: string;
  imageSource?: "search-api" | "page-metadata" | "structured-source";
  primaryImage?: ListingImage;
  galleryImages?: ListingImage[];
  enrichmentMethod?: ListingEnrichmentResult["extractionMethod"];
  enrichmentConfidence?: number;
}

export interface PlatformShortcut {
  name: string;
  url: string;
}

export interface WebSearchResponse {
  query: string;
  parsedQuery: ParsedGuitarSearch;
  generatedQueries: string[];
  webResults: WebSearchResult[];
  count: number;
  hasMore: boolean;
  nextCursor?: string;
  candidateCount: number;
  qualifiedCount: number;
  rejectedCount: number;
  checkedTimestamp: string;
  summary: string;
  shortcuts: PlatformShortcut[];
  apiConfigured: boolean;
  searchCompleted: boolean;
  errorMessage?: string;
  diagnostics?: SearchDiagnostics;
}

export interface SearchDiagnostics {
  originalQuery: string;
  canonicalQuery: CanonicalSearchQuery;
  queryVariants: string[];
  braveRequestCount: number;
  braveResponseCount: number;
  rawCandidateCount: number;
  duplicateCount: number;
  rejectedCount: number;
  qualifiedCount: number;
  apiErrors: Array<{
    query?: string;
    status?: number;
    message: string;
  }>;
  rejectionReasons: Record<string, number>;
  metadataFetchAttempts?: number;
  metadataFetchSuccesses?: number;
  jsonLdOfferPricesExtracted?: number;
  searchRichResultPricesExtracted?: number;
  fallbackPriceLabelsUsed?: number;
  rejectedPriceCandidates?: number;
  sourceSpecificParserErrors?: number;
  directAdapterRequestCount?: number;
  directAdapterListingCount?: number;
  soldOrUnavailableRemoved?: number;
  unknownDomainsDiscovered?: number;
}

interface SearchCursorVariant {
  query: string;
  nextOffset: number;
  exhausted: boolean;
}

interface SearchCursor {
  originalQuery: string;
  canonicalQueryHash: string;
  queryVariants: SearchCursorVariant[];
  seenUrls: string[];
  seenTitleKeys: string[];
  emittedListingIds: string[];
  pendingResults: WebSearchResult[];
}

interface CacheEntry {
  expiresAt: number;
  response: WebSearchResponse;
}

interface ClassificationDiagnostics {
  rawCandidateCount: number;
  duplicateCount: number;
  rejectedCount: number;
  qualifiedCount: number;
  rejectionReasons: Record<string, number>;
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

const searchCache = new Map<string, CacheEntry>();
export const QUALIFIED_RESULTS_PER_BATCH = 12;
const BRAVE_RESULTS_PER_PAGE = 20;
const MAX_BRAVE_OFFSET = 9;

const siteQueries = targetedSearchScopes();

const knownFinishes = [
  "sonic blue",
  "fiesta red",
  "cobalt smokeburst",
  "holcomb burst",
  "satin silver",
  "satin laguna burst",
  "green tiger eye",
  "arctic dream",
  "black flat",
  "butterscotch",
  "olympic white"
];

const staleTerms = ["sold", "ended", "listing ended", "listing has ended", "archived", "unavailable", "expired", "out of stock", "removed", "no longer available", "item unavailable"];
const purchaseTerms = ["for sale", "buy", "in stock", "used", "new", "shop", "listing", "add to cart", "buy now", "$"];
const rejectedDomains = ["wikipedia.org", "youtube.com", "youtu.be", "reddit.com"];
const manufacturerDomains = ["fender.com", "prsguitars.com", "jacksonguitars.com", "ibanez.com"];

function normalize(value: string | undefined) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function compact(value: string | undefined) {
  return normalize(value).replace(/\s+/g, "");
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function incrementReason(reasons: Record<string, number>, reason: string) {
  reasons[reason] = (reasons[reason] ?? 0) + 1;
}

function canonicalSearchQuery(parsed: ParsedGuitarSearch): CanonicalSearchQuery {
  return {
    brand: parsed.brand,
    model: parsed.model,
    family: parsed.family,
    finish: parsed.finish,
    requiredConcepts: parsed.requiredConcepts ?? parsed.requiredTerms,
    preferredConcepts: parsed.preferredConcepts ?? [],
    excludeTerms: parsed.excludeTerms ?? parsed.exclusionTerms
  };
}

function canonicalQueryHash(query: string) {
  return createHash("sha256").update(normalize(query)).digest("hex");
}

function cursorSigningSecret() {
  return process.env.SEARCH_CURSOR_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.BRAVE_SEARCH_API_KEY || "local-search-cursor-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signCursorPayload(payload: string) {
  return createHmac("sha256", cursorSigningSecret()).update(payload).digest("base64url");
}

function encodeCursor(cursor: SearchCursor) {
  const payload = base64UrlEncode(JSON.stringify(cursor));
  const signature = signCursorPayload(payload);
  return `${payload}.${signature}`;
}

function decodeCursor(value: string | undefined, query: string): SearchCursor | undefined {
  try {
    if (!value) return undefined;
    const [payload, signature] = value.split(".");
    if (!payload || !signature) return undefined;
    const expected = signCursorPayload(payload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return undefined;
    const cursor = JSON.parse(base64UrlDecode(payload)) as SearchCursor;
    if (cursor.canonicalQueryHash !== canonicalQueryHash(query)) return undefined;
    return cursor;
  } catch {
    return undefined;
  }
}

export function clearWebSearchCache() {
  searchCache.clear();
  clearListingEnrichmentCache();
}

export function parseGuitarSearch(query: string): ParsedGuitarSearch {
  const q = normalize(query);
  const parsed: ParsedGuitarSearch = {
    originalQuery: query,
    requiredTerms: [],
    exclusionTerms: []
  };

  if (q.includes("prs")) parsed.brand = "PRS";
  if (q.includes("fender")) parsed.brand = "Fender";
  if (q.includes("jackson")) parsed.brand = "Jackson";
  if (q.includes("ibanez")) parsed.brand = "Ibanez";

  if (q.includes("custom shop")) parsed.family = "Custom Shop";
  if (q.includes("core")) parsed.family = "Core";
  if (q.includes(" se ") || q.startsWith("se ") || q.includes(" prs se")) parsed.family = "SE";

  if (q.includes("holcomb")) {
    parsed.model = parsed.family === "SE" ? "SE Mark Holcomb" : "Mark Holcomb Core";
    parsed.artistSignature = "Mark Holcomb";
  }
  if ((q.includes("1963") || q.includes("63")) && q.includes("strat")) {
    parsed.model = "1963 Stratocaster";
    parsed.year = 1963;
  }
  if (q.includes("jazzmaster")) {
    parsed.model = "Jazzmaster";
  }
  if (q.includes("ht6")) {
    parsed.variant = "HT6";
    parsed.strings = 6;
  }
  if (q.includes("ht7")) {
    parsed.variant = "HT7";
    parsed.strings = 7;
  }

  const finish = knownFinishes.find(candidate => q.includes(candidate));
  if (finish) parsed.finish = finish.split(" ").map(part => part[0].toUpperCase() + part.slice(1)).join(" ");

  if (parsed.brand === "PRS" && parsed.family === "Core" && q.includes("holcomb")) {
    parsed.requiredConcepts = ["PRS", "Holcomb", "Core"];
    parsed.preferredConcepts = unique(["Mark", parsed.finish].filter(Boolean) as string[]);
    parsed.excludeTerms = ["SE"];
  }

  parsed.requiredTerms = parsed.requiredConcepts ?? unique([
    parsed.brand,
    parsed.family,
    parsed.model,
    parsed.variant,
    parsed.finish,
    parsed.year ? String(parsed.year) : undefined
  ].filter(Boolean) as string[]);

  if (parsed.brand === "PRS" && parsed.family === "Core") {
    parsed.exclusionTerms.push("prs se", "se mark holcomb", "student edition");
  }
  if (parsed.brand === "Fender" && parsed.family === "Custom Shop") {
    parsed.exclusionTerms.push("vintera", "player", "player stratocaster", "squier", "american performer", "mexico", "mim", "wikipedia");
  }
  if (parsed.model?.toLowerCase().includes("jazzmaster")) {
    parsed.exclusionTerms.push("stratocaster", "telecaster", "jaguar");
  }
  if (parsed.model?.toLowerCase().includes("stratocaster")) {
    parsed.exclusionTerms.push("jazzmaster", "telecaster", "jaguar");
  }
  if (parsed.variant === "HT6" || parsed.strings === 6) {
    parsed.exclusionTerms.push("ht7", "7-string", "7 string");
  }
  if (parsed.variant === "HT7" || parsed.strings === 7) {
    parsed.exclusionTerms.push("ht6", "6-string", "6 string");
  }

  parsed.excludeTerms = unique([...(parsed.excludeTerms ?? []), ...parsed.exclusionTerms]);

  return parsed;
}

function quote(value: string | undefined) {
  return value ? `"${value}"` : "";
}

export function generateGuitarSearchQueries(parsed: ParsedGuitarSearch) {
  const modelPhrase = [parsed.year, parsed.model].filter(Boolean).join(" ").replace(/^1963 1963 /, "1963 ");
  const brandFamily = [parsed.brand, parsed.family].filter(Boolean).join(" ");
  const precise = [quote(brandFamily), quote(modelPhrase || parsed.model), quote(parsed.variant), quote(parsed.finish)].filter(Boolean).join(" ");
  const full = [parsed.brand, parsed.family, parsed.model, parsed.variant].filter(Boolean).join(" ");
  const commercialPhrase = quote([parsed.brand, parsed.family, parsed.model, parsed.variant, parsed.finish].filter(Boolean).join(" ") || parsed.originalQuery);
  const finish = quote(parsed.finish);
  const exclusions = parsed.exclusionTerms
    .filter(term => !["forum"].includes(normalize(term)))
    .map(term => `-${normalize(term).replace(/\s+/g, "-")}`)
    .join(" ");
  const commercialIntents = ["for sale", "buy", "in stock", "used", "new", "guitar shop", "UK", "Europe", "Japan"];
  const broadCommercialQueries = commercialIntents.map(intent => [commercialPhrase, intent, exclusions].filter(Boolean).join(" "));
  const targetedQueries = siteQueries.map(site => `site:${site} ${[quote(brandFamily || parsed.brand), quote(modelPhrase || parsed.model || parsed.originalQuery), quote(parsed.variant), finish, site.includes("thegearpage") ? "" : exclusions].filter(Boolean).join(" ")}`);

  const holcombAlias = parsed.brand === "PRS" && parsed.family === "Core" && parsed.model === "Mark Holcomb Core"
    ? [
        [quote("PRS Holcomb Core"), finish, "for sale", exclusions].filter(Boolean).join(" "),
        ["PRS Holcomb Core", parsed.finish, "guitar", "listing", exclusions].filter(Boolean).join(" "),
        ["PRS Mark Holcomb Core", parsed.finish, "buy", exclusions].filter(Boolean).join(" "),
        ...siteQueries.map(site => `site:${site} ${["PRS Holcomb Core", parsed.finish, site.includes("thegearpage") ? "" : exclusions].filter(Boolean).join(" ")}`)
      ]
    : [];

  return unique([
    ...holcombAlias,
    [precise || quote(parsed.originalQuery), "for sale", exclusions].filter(Boolean).join(" "),
    [quote(full || parsed.originalQuery), finish, "buy", exclusions].filter(Boolean).join(" "),
    [quote([parsed.brand, parsed.family, parsed.model, parsed.finish].filter(Boolean).join(" ") || parsed.originalQuery), "guitar", "in stock", exclusions].filter(Boolean).join(" "),
    ...targetedQueries,
    ...broadCommercialQueries
  ].filter(query => query.trim().length > 0));
}

function canonicalUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (/^(utm_|fbclid|gclid|mc_)/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return parsed.toString();
  } catch {
    return url.trim().toLowerCase();
  }
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown source";
  }
}

function sourceName(result: BraveWebResult, url: string) {
  const registryName = displayNameForUrl(url);
  if (registryName) return registryName;
  if (result.profile?.name) return result.profile.name;
  const domain = domainFromUrl(url).split(".");
  return domain[0] ? domain[0][0].toUpperCase() + domain[0].slice(1) : undefined;
}

function possiblePrice(text: string) {
  const price = extractPriceFromText(text, "search-rich-result");
  return price.confidence >= 0.85 ? price.label : undefined;
}

function possibleLocation(text: string) {
  const location = text.match(/\b(?:United States|USA|UK|Japan|Canada|Australia|Germany|Netherlands|France|California|New York|Texas|Florida|London|Tokyo)\b/i)?.[0];
  return location;
}

function urlPath(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function sourceTypeForUrl(url: string): UnifiedSourceType {
  const registryType = sourceTypeForListingUrl(url);
  if (registryType) return registryType;
  const domain = domainFromUrl(url);
  if (domain.includes("reverb") || domain.includes("ebay") || domain.includes("facebook")) return "marketplace";
  if (domain.includes("craigslist")) return "classified";
  if (domain.includes("thegearpage")) return "forum-classified";
  if (domain.includes(".co.uk") || domain.includes(".jp") || domain.includes("japan")) return "international-retailer";
  if (domain.includes("wildwood") || domain.includes("ish.guitars") || domain.includes("chicagomusicexchange")) return "boutique";
  return "retailer";
}

function isMarketplaceItemUrl(url: string) {
  const value = url.toLowerCase();
  return (
    isMarketplaceItemUrlByRegistry(url) ||
    value.includes("reverb.com/item/") ||
    value.includes("ebay.com/itm/") ||
    value.includes("facebook.com/marketplace/item/") ||
    /craigslist\.org\/.+\/\d+\.html/i.test(value) ||
    value.includes("thegearpage.net/board/index.php?threads/")
  );
}

function isLikelyIndividualProductUrl(url: string) {
  return isMarketplaceItemUrl(url) || /(\/p\/|\/product\/|\/products\/|\/store\/detail\/|\/item\/|\/itm\/|\/threads\/)/i.test(url.toLowerCase());
}

function isSearchOrLandingPage(url: string, text: string) {
  const value = url.toLowerCase();
  const normalized = normalize(text);
  return (
    isSearchOrLandingUrl(url, text) ||
    value.includes("wikipedia.org") ||
    rejectedDomains.some(domain => value.includes(domain)) ||
    value.includes("/search") ||
    value.includes("/marketplace?") ||
    value.includes("/sch/") ||
    value.includes("/category") ||
    value.includes("/categories") ||
    value.includes("/collections") ||
    value.includes("/products/electric-guitars") ||
    value.includes("/electric-guitars") && manufacturerDomains.some(domain => value.includes(domain)) ||
    /\b(review|history|wiki|specs only|buyers guide)\b/.test(normalized)
  );
}

function buyabilityScore(result: BraveWebResult, text: string) {
  if (!result.url) return 0;
  const url = result.url.toLowerCase();
  const domain = domainFromUrl(result.url);
  const normalized = normalize(text);
  let score = 0;

  if (isSearchOrLandingPage(result.url, text)) return 0;
  if (isMarketplaceItemUrl(result.url)) score += 0.72;
  if (/(\/p\/|\/product\/|\/products\/|\/store\/detail\/|\/item\/|\/itm\/|\/threads\/)/i.test(url)) score += 0.38;
  if (possiblePrice(text)) score += 0.22;
  if (purchaseTerms.some(term => normalized.includes(normalize(term)))) score += 0.2;
  if (/\b(condition|seller|shipping|add to cart|buy now|in stock|used|new)\b/.test(normalized)) score += 0.15;
  if (manufacturerDomains.some(manufacturer => domain.includes(manufacturer))) score -= 0.35;
  if (staleTerms.some(term => normalized.includes(term))) score -= 0.25;

  return Math.max(0, Math.min(1, score));
}

function exactMatchConfidence(parsed: ParsedGuitarSearch, text: string, url: string) {
  const normalized = normalize(`${text} ${urlPath(url)}`);
  const required = parsed.requiredTerms;
  if (!required.length) return 0.82;

  let score = 0;
  for (const term of required) {
    const pieces = normalize(term).split(" ").filter(Boolean);
    const allPiecesPresent = pieces.every(piece => normalized.includes(piece));
    if (allPiecesPresent) score += 1 / required.length;
  }

  if (parsed.finish && !normalized.includes(normalize(parsed.finish))) score -= 0.18;
  if (parsed.model && !normalize(parsed.model).split(" ").some(piece => normalized.includes(piece))) score -= 0.25;
  if (hasContradiction(parsed, text)) return 0;

  for (const preferred of parsed.preferredConcepts ?? []) {
    if (normalize(preferred).split(" ").every(piece => normalized.includes(piece))) score += 0.04;
  }

  return Math.max(0, Math.min(1, score));
}

function metadataCompleteness(result: WebSearchResult) {
  let score = 0;
  if (result.primaryImage?.url || result.thumbnailUrl) score += 0.28;
  if (result.itemPrice !== undefined || result.possiblePrice) score += 0.3;
  if (result.possibleLocation) score += 0.12;
  if (result.snippet) score += 0.18;
  if (result.freshnessStatus === "recently-checked") score += 0.12;
  return Math.min(1, score);
}

function freshnessConfidence(result: WebSearchResult) {
  if (result.freshnessStatus === "recently-checked") return 1;
  if (result.freshnessStatus === "availability-unverified") return 0.58;
  return 0.18;
}

function sourceQuality(result: WebSearchResult) {
  const direct = isMarketplaceItemUrl(result.url) || /\/(product|products|item|itm|p)\//i.test(result.url);
  if (direct && result.sourceType !== "retailer") return 0.9;
  if (direct) return 0.75;
  return 0.45;
}

function applyEnrichment(result: WebSearchResult, enrichment: ListingEnrichmentResult): WebSearchResult {
  const itemPrice = enrichment.confidence >= 0.85 ? enrichment.itemPrice : undefined;
  const primaryImage = enrichment.primaryImage;
  const galleryImages = enrichment.galleryImages?.length ? enrichment.galleryImages : primaryImage ? [primaryImage] : undefined;
  return {
    ...result,
    title: enrichment.title || result.title,
    possiblePrice: itemPrice !== undefined ? enrichment.priceLabel : result.possiblePrice,
    itemPrice,
    currency: itemPrice !== undefined ? enrichment.currency : result.currency,
    priceLabel: itemPrice !== undefined ? enrichment.priceLabel : undefined,
    availability: enrichment.availability,
    condition: enrichment.condition,
    sellerName: enrichment.sellerName,
    possibleLocation: enrichment.locationLabel || result.possibleLocation,
    thumbnailUrl: primaryImage?.url || result.thumbnailUrl,
    imageSource: primaryImage?.source === "json-ld" || primaryImage?.source === "open-graph" || primaryImage?.source === "source-adapter" ? "page-metadata" : result.imageSource,
    primaryImage,
    galleryImages,
    extractionMethod: enrichment.extractionMethod === "none" ? result.extractionMethod : "permitted-page-metadata",
    enrichmentMethod: enrichment.extractionMethod,
    enrichmentConfidence: enrichment.confidence,
    freshnessStatus: enrichment.availability && /instock|in stock|available/i.test(enrichment.availability) ? "recently-checked" : result.freshnessStatus
  };
}

function rankScore(result: WebSearchResult) {
  const hasNumericPrice = result.itemPrice !== undefined ? 1 : 0;
  const hasSourceBackedImage = result.primaryImage?.url || result.thumbnailUrl ? 1 : 0;
  return (
    result.exactMatchConfidence * 38 +
    result.buyabilityScore * 22 +
    metadataCompleteness(result) * 14 +
    freshnessConfidence(result) * 10 +
    sourceQuality(result) * 6 +
    hasNumericPrice * 5 +
    hasSourceBackedImage * 5
  );
}

function hasContradiction(parsed: ParsedGuitarSearch, text: string) {
  const normalized = ` ${normalize(text)} `;
  const compacted = compact(text);

  if (parsed.exclusionTerms.some(term => normalized.includes(` ${normalize(term)} `) || compacted.includes(compact(term)))) return true;

  if (parsed.finish) {
    const requiredFinish = normalize(parsed.finish);
    const conflictingFinish = knownFinishes.find(finish => finish !== requiredFinish && normalized.includes(` ${finish} `));
    if (conflictingFinish) return true;
  }

  if (parsed.variant === "HT6" && /\bht7\b/i.test(text)) return true;
  if (parsed.variant === "HT7" && /\bht6\b/i.test(text)) return true;

  return false;
}

function contradictionReason(parsed: ParsedGuitarSearch, text: string) {
  const normalized = ` ${normalize(text)} `;
  const compacted = compact(text);

  if (parsed.excludeTerms?.some(term => normalized.includes(` ${normalize(term)} `) || compacted.includes(compact(term)))) {
    return parsed.family === "Core" && /(\bse\b|semarkholcomb|studentedition)/i.test(normalized + compacted) ? "wrong-family" : "wrong-model";
  }
  if (parsed.exclusionTerms.some(term => normalized.includes(` ${normalize(term)} `) || compacted.includes(compact(term)))) {
    if (["vintera", "player", "squier", "american performer", "mexico", "mim"].some(term => normalized.includes(` ${term} `))) return "wrong-family";
    if (["stratocaster", "telecaster", "jaguar", "jazzmaster"].some(term => normalized.includes(` ${term} `))) return "wrong-model";
    if (["ht6", "ht7", "6string", "7string"].some(term => compacted.includes(term))) return "wrong-variant";
    return "wrong-model";
  }

  if (parsed.finish) {
    const requiredFinish = normalize(parsed.finish);
    const conflictingFinish = knownFinishes.find(finish => finish !== requiredFinish && normalized.includes(` ${finish} `));
    if (conflictingFinish) return "wrong-finish";
  }

  if (parsed.variant === "HT6" && /\bht7\b/i.test(text)) return "wrong-variant";
  if (parsed.variant === "HT7" && /\bht6\b/i.test(text)) return "wrong-variant";

  return undefined;
}

function searchOrLandingReason(url: string, text: string) {
  const value = url.toLowerCase();
  const normalized = normalize(text);
  if (value.includes("wikipedia.org") || /\b(wiki|history|review|buyers guide)\b/.test(normalized)) return "informational-page";
  if (value.includes("/search") || value.includes("/marketplace?") || value.includes("/sch/")) return "search-page-not-listing";
  if (value.includes("/category") || value.includes("/categories") || value.includes("/collections") || value.includes("/products/electric-guitars")) return "search-page-not-listing";
  if (value.includes("/electric-guitars") && manufacturerDomains.some(domain => value.includes(domain))) return "search-page-not-listing";
  if (rejectedDomains.some(domain => value.includes(domain))) return "informational-page";
  return "non-purchasable-page";
}

function classifyWebResultWithReason(parsed: ParsedGuitarSearch, result: BraveWebResult): { result: WebSearchResult | null; reason?: string } {
  if (!result.url || !result.title) return { result: null, reason: "missing-required-data" };

  const text = `${result.title} ${result.description ?? ""} ${result.profile?.name ?? ""} ${result.meta_url?.hostname ?? ""}`;
  const contradiction = contradictionReason(parsed, text);
  if (contradiction) return { result: null, reason: contradiction };
  if (isSearchOrLandingPage(result.url, text)) return { result: null, reason: searchOrLandingReason(result.url, text) };

  const normalized = normalize(text);
  const availability = assessListingAvailability(text, result.url);
  if (!availability.isAvailable) return { result: null, reason: "sold-or-archived" };
  const warningTerms = staleTerms.filter(term => normalized.includes(term));
  if (warningTerms.length) return { result: null, reason: "sold-or-archived" };

  const buyability = buyabilityScore(result, text);
  const exact = exactMatchConfidence(parsed, text, result.url);
  const strongIndividualMatch = isLikelyIndividualProductUrl(result.url) && exact >= 0.9 && buyability >= 0.45;
  if (exact < 0.82) return { result: null, reason: parsed.brand && !normalized.includes(normalize(parsed.brand)) ? "wrong-brand" : "wrong-model" };
  if (buyability < 0.72 && !strongIndividualMatch) return { result: null, reason: isLikelyIndividualProductUrl(result.url) ? "missing-required-data" : "non-purchasable-page" };

  const freshnessStatus: WebSearchResult["freshnessStatus"] = /\b(in stock|available|new|used|for sale|buy now|add to cart)\b/.test(normalized)
    ? "recently-checked"
    : "availability-unverified";
  const thumbnailUrl = result.thumbnail?.src;
  const price = possiblePrice(text);
  const confidence: WebMatchConfidence = exact >= 0.94 && buyability >= 0.82 && price && thumbnailUrl ? "Likely exact match" : "Possible exact match";
  const warning = freshnessStatus === "availability-unverified"
    ? "Availability unverified. Open the listing to confirm."
    : undefined;

  const canonical = canonicalUrl(result.url);
  const registrySource = sourceForUrl(result.url);
  if (!registrySource) recordSourceDiscoveryCandidate(result.url);

  return {
    result: {
      id: canonical,
      title: result.title,
      url: result.url,
      sourceDomain: result.meta_url?.hostname ?? domainFromUrl(result.url),
      sourceName: sourceName(result, result.url),
      sourceType: sourceTypeForUrl(result.url),
      snippet: result.description,
      possiblePrice: price,
      possibleLocation: possibleLocation(text),
      confidence,
      exactMatchConfidence: exact,
      buyabilityScore: buyability,
      freshnessStatus,
      extractionMethod: "search-api",
      isPurchasablePage: true,
      availabilityWarning: warning,
      thumbnailUrl,
      imageSource: thumbnailUrl ? "search-api" : undefined
    }
  };
}

export function classifyWebResult(parsed: ParsedGuitarSearch, result: BraveWebResult): WebSearchResult | null {
  return classifyWebResultWithReason(parsed, result).result;
}

export function mergeAndFilterWebResults(parsed: ParsedGuitarSearch, results: BraveWebResult[]) {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const filtered: WebSearchResult[] = [];

  for (const result of results) {
    const classified = classifyWebResult(parsed, result);
    if (!classified) continue;

    const urlKey = canonicalUrl(classified.url);
    const titleKey = normalize(classified.title).slice(0, 90);
    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) continue;
    seenUrls.add(urlKey);
    seenTitles.add(titleKey);
    filtered.push(classified);
  }

  return filtered.sort((a, b) => rankScore(b) - rankScore(a));
}

export function platformShortcuts(query: string): PlatformShortcut[] {
  const encoded = encodeURIComponent(query);
  return [
    { name: "Facebook Marketplace", url: `https://www.facebook.com/marketplace/search/?query=${encoded}` },
    { name: "Craigslist", url: `https://www.craigslist.org/search/sss?query=${encoded}` },
    { name: "The Gear Page Guitar Emporium", url: `https://www.thegearpage.net/board/index.php?search/search&keywords=${encoded}` },
    { name: "Reverb", url: `https://reverb.com/marketplace?query=${encoded}` },
    { name: "eBay", url: `https://www.ebay.com/sch/i.html?_nkw=${encoded}` },
    { name: "Google", url: `https://www.google.com/search?q=${encoded}` }
  ];
}

async function braveSearch(query: string, apiKey: string, fetcher: Fetcher, offset = 0) {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(BRAVE_RESULTS_PER_PAGE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("search_lang", "en");

  const response = await fetcher(url.toString(), {
    headers: {
      "X-Subscription-Token": apiKey,
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    const error = new Error(`Brave Search failed with status ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const body = await response.json().catch(() => {
    throw new Error("Malformed Brave Search response");
  }) as { web?: { results?: BraveWebResult[] } };
  if (!body.web?.results) return [];
  if (!Array.isArray(body.web.results)) throw new Error("Malformed Brave Search response");
  return body.web.results;
}

function emptyCursor(query: string, generatedQueries: string[]): SearchCursor {
  return {
    originalQuery: query,
    canonicalQueryHash: canonicalQueryHash(query),
    queryVariants: generatedQueries.map(searchQuery => ({ query: searchQuery, nextOffset: 0, exhausted: false })),
    seenUrls: [],
    seenTitleKeys: [],
    emittedListingIds: [],
    pendingResults: []
  };
}

function cursorHasMore(cursor: SearchCursor) {
  return cursor.pendingResults.length > 0 || cursor.queryVariants.some(variant => !variant.exhausted && variant.nextOffset <= MAX_BRAVE_OFFSET);
}

function classifyPaginatedResults(parsedQuery: ParsedGuitarSearch, cursor: SearchCursor, rawResults: BraveWebResult[]) {
  let candidateCount = 0;
  let rejectedCount = 0;
  let duplicateCount = 0;
  const rejectionReasons: Record<string, number> = {};
  const qualified: WebSearchResult[] = [];
  const seenUrls = new Set(cursor.seenUrls);
  const seenTitleKeys = new Set(cursor.seenTitleKeys);

  for (const result of rawResults) {
    candidateCount += 1;
    const classifiedResult = classifyWebResultWithReason(parsedQuery, result);
    const classified = classifiedResult.result;
    if (!classified) {
      rejectedCount += 1;
      incrementReason(rejectionReasons, classifiedResult.reason ?? "missing-required-data");
      continue;
    }

    const urlKey = canonicalUrl(classified.url);
    const titleKey = normalize(classified.title).slice(0, 90);
    if (seenUrls.has(urlKey) || seenTitleKeys.has(titleKey)) {
      duplicateCount += 1;
      rejectedCount += 1;
      incrementReason(rejectionReasons, "duplicate");
      continue;
    }

    seenUrls.add(urlKey);
    seenTitleKeys.add(titleKey);
    cursor.seenUrls.push(urlKey);
    cursor.seenTitleKeys.push(titleKey);
    qualified.push(classified);
  }

  return { candidateCount, duplicateCount, rejectedCount, rejectionReasons, qualified };
}

async function collectQualifiedBatch(parsedQuery: ParsedGuitarSearch, cursor: SearchCursor, apiKey: string, fetcher: Fetcher, forceRefresh = false) {
  const emitted: WebSearchResult[] = [];
  let candidateCount = 0;
  let duplicateCount = 0;
  let rejectedCount = 0;
  let braveRequestCount = 0;
  let braveResponseCount = 0;
  const apiErrors: SearchDiagnostics["apiErrors"] = [];
  const rejectionReasons: Record<string, number> = {};
  let metadataFetchAttempts = 0;
  let metadataFetchSuccesses = 0;
  let jsonLdOfferPricesExtracted = 0;
  let searchRichResultPricesExtracted = 0;
  let fallbackPriceLabelsUsed = 0;
  let rejectedPriceCandidates = 0;
  let sourceSpecificParserErrors = 0;
  let directAdapterRequestCount = 0;
  let directAdapterListingCount = 0;
  let soldOrUnavailableRemoved = 0;
  let unknownDomainsDiscovered = 0;

  while (cursor.pendingResults.length > 0 && emitted.length < QUALIFIED_RESULTS_PER_BATCH) {
    const next = cursor.pendingResults.shift();
    if (next) emitted.push(next);
  }

  if (!cursor.seenUrls.length) {
    const direct = await collectDirectAdapterResults(parsedQuery, fetcher);
    directAdapterRequestCount = direct.adapterRequestCount;
    directAdapterListingCount = direct.directListingCount;
    soldOrUnavailableRemoved += direct.soldOrUnavailableRemoved;
    direct.apiErrors.forEach(error => apiErrors.push(error));
    for (const result of direct.webResults) {
      const urlKey = canonicalUrl(result.url);
      const titleKey = normalize(result.title).slice(0, 90);
      if (cursor.seenUrls.includes(urlKey) || cursor.seenTitleKeys.includes(titleKey)) continue;
      cursor.seenUrls.push(urlKey);
      cursor.seenTitleKeys.push(titleKey);
      if (emitted.length < QUALIFIED_RESULTS_PER_BATCH) emitted.push(result);
      else cursor.pendingResults.push(result);
    }
  }

  let cursorIndex = 0;
  while (emitted.length < QUALIFIED_RESULTS_PER_BATCH && cursorHasMore(cursor)) {
    const variant = cursor.queryVariants[cursorIndex % cursor.queryVariants.length];
    cursorIndex += 1;

    if (!variant || variant.exhausted) {
      if (cursorIndex > cursor.queryVariants.length * 2 && !cursor.queryVariants.some(item => !item.exhausted)) break;
      continue;
    }

    if (variant.nextOffset > MAX_BRAVE_OFFSET) {
      variant.exhausted = true;
      continue;
    }

    const offset = variant.nextOffset;
    variant.nextOffset += 1;
    let rawResults: BraveWebResult[] = [];
    braveRequestCount += 1;
    try {
      rawResults = await braveSearch(variant.query, apiKey, fetcher, offset);
      braveResponseCount += 1;
    } catch (error) {
      const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : undefined;
      apiErrors.push({ query: variant.query, status, message: error instanceof Error ? error.message : "Search request failed" });
      variant.exhausted = true;
      continue;
    }
    if (rawResults.length === 0 || variant.nextOffset > MAX_BRAVE_OFFSET) variant.exhausted = true;

    const classified = classifyPaginatedResults(parsedQuery, cursor, rawResults);
    candidateCount += classified.candidateCount;
    duplicateCount += classified.duplicateCount;
    rejectedCount += classified.rejectedCount;
    Object.entries(classified.rejectionReasons).forEach(([reason, count]) => {
      rejectionReasons[reason] = (rejectionReasons[reason] ?? 0) + count;
    });

    const enrichedResults: WebSearchResult[] = [];
    for (const result of classified.qualified) {
      metadataFetchAttempts += 1;
      const enrichment = await enrichListingMetadata({
        url: result.url,
        title: result.title,
        snippet: result.snippet,
        possiblePrice: result.possiblePrice,
        thumbnailUrl: result.thumbnailUrl,
        sourceName: result.sourceName,
        sourceDomain: result.sourceDomain
      }, { fetcher, forceRefresh });
      if (enrichment.confidence > 0) metadataFetchSuccesses += 1;
      if (enrichment.extractionMethod === "json-ld-offer" && enrichment.itemPrice !== undefined) jsonLdOfferPricesExtracted += 1;
      if (enrichment.extractionMethod === "search-rich-result" && enrichment.itemPrice !== undefined) searchRichResultPricesExtracted += 1;
      if (enrichment.itemPrice === undefined) fallbackPriceLabelsUsed += 1;
      if (enrichment.rejectionReasons?.some(reason => reason.includes("price"))) rejectedPriceCandidates += 1;
      if (enrichment.rejectionReasons?.includes("source-specific-parser-error")) sourceSpecificParserErrors += 1;
      enrichment.rejectionReasons?.forEach(reason => incrementReason(rejectionReasons, reason));
      const enriched = applyEnrichment(result, enrichment);
      const postEnrichmentAvailability = assessListingAvailability(`${enriched.title} ${enriched.snippet ?? ""}`, enriched.url, enriched.availability);
      if (!postEnrichmentAvailability.isAvailable) {
        soldOrUnavailableRemoved += 1;
        incrementReason(rejectionReasons, "sold-or-archived");
        continue;
      }
      if (!sourceForUrl(enriched.url)) {
        recordSourceDiscoveryCandidate(enriched.url);
        unknownDomainsDiscovered += 1;
      }
      enrichedResults.push(enriched);
    }

    const ranked = enrichedResults.sort((a, b) => rankScore(b) - rankScore(a));
    for (const result of ranked) {
      if (emitted.length < QUALIFIED_RESULTS_PER_BATCH) emitted.push(result);
      else cursor.pendingResults.push(result);
    }
  }

  emitted.forEach(result => cursor.emittedListingIds.push(result.id));

  return {
    webResults: emitted.sort((a, b) => rankScore(b) - rankScore(a)),
    candidateCount,
    duplicateCount,
    qualifiedCount: emitted.length,
    rejectedCount,
    braveRequestCount,
    braveResponseCount,
    apiErrors,
    rejectionReasons,
    metadataFetchAttempts,
    metadataFetchSuccesses,
    jsonLdOfferPricesExtracted,
    searchRichResultPricesExtracted,
    fallbackPriceLabelsUsed,
    rejectedPriceCandidates,
    sourceSpecificParserErrors,
    directAdapterRequestCount,
    directAdapterListingCount,
    soldOrUnavailableRemoved,
    unknownDomainsDiscovered
  };
}

async function collectDirectAdapterResults(parsedQuery: ParsedGuitarSearch, fetcher: Fetcher) {
  const webResults: WebSearchResult[] = [];
  const apiErrors: SearchDiagnostics["apiErrors"] = [];
  let adapterRequestCount = 0;
  let directListingCount = 0;
  let soldOrUnavailableRemoved = 0;
  const canonical = parsedSearchToCanonical(parsedQuery);

  for (const adapter of defaultSourceAdapters({ fetcher })) {
    if (adapter.sourceId !== "ebay") continue;
    adapterRequestCount += 1;
    const response = await adapter.search(canonical).catch(error => ({
      sourceId: adapter.sourceId,
      listings: [],
      searchedAliases: [],
      errors: [error instanceof Error ? error.message : "Source adapter failed"]
    }));
    response.errors.forEach(message => {
      if (!message.includes("not configured")) apiErrors.push({ query: adapter.sourceId, message });
    });
    for (const listing of response.listings) {
      const text = `${listing.title} ${listing.condition ?? ""} ${listing.availability ?? ""}`;
      const availability = assessListingAvailability(text, listing.url, listing.availability);
      if (!availability.isAvailable) {
        soldOrUnavailableRemoved += 1;
        continue;
      }
      if (hasContradiction(parsedQuery, text)) continue;
      const exact = exactMatchConfidence(parsedQuery, text, listing.url);
      if (exact < 0.82) continue;
      const webResult = sourceListingToWebResult(listing);
      webResults.push({
        ...webResult,
        exactMatchConfidence: exact,
        confidence: exact >= 0.94 && webResult.itemPrice !== undefined && webResult.thumbnailUrl ? "Likely exact match" : "Possible exact match"
      });
      directListingCount += 1;
    }
  }

  return { webResults, apiErrors, adapterRequestCount, directListingCount, soldOrUnavailableRemoved };
}

export async function searchOpenWebForGuitars(query: string, options: {
  apiKey?: string;
  ttlSeconds?: number;
  now?: number;
  fetcher?: Fetcher;
  forceRefresh?: boolean;
  cursor?: string;
} = {}): Promise<WebSearchResponse> {
  const now = options.now ?? Date.now();
  const ttlSeconds = options.ttlSeconds ?? Number(process.env.WEB_SEARCH_CACHE_TTL_SECONDS || 900);
  const apiKey = options.apiKey ?? process.env.BRAVE_SEARCH_API_KEY;
  const cacheKey = `${normalize(query)}:${options.cursor ? "cursor" : "initial"}`;
  const cached = searchCache.get(cacheKey);

  if (!options.cursor && !options.forceRefresh && cached && cached.expiresAt > now) return cached.response;

  const parsedQuery = parseGuitarSearch(query);
  const generatedQueries = generateGuitarSearchQueries(parsedQuery);
  const cursor = decodeCursor(options.cursor, query) ?? emptyCursor(query, generatedQueries);
  let batch = {
    webResults: [] as WebSearchResult[],
    candidateCount: 0,
    duplicateCount: 0,
    qualifiedCount: 0,
    rejectedCount: 0,
    braveRequestCount: 0,
    braveResponseCount: 0,
    apiErrors: [] as SearchDiagnostics["apiErrors"],
    rejectionReasons: {} as Record<string, number>,
    metadataFetchAttempts: 0,
    metadataFetchSuccesses: 0,
    jsonLdOfferPricesExtracted: 0,
    searchRichResultPricesExtracted: 0,
    fallbackPriceLabelsUsed: 0,
    rejectedPriceCandidates: 0,
    sourceSpecificParserErrors: 0,
    directAdapterRequestCount: 0,
    directAdapterListingCount: 0,
    soldOrUnavailableRemoved: 0,
    unknownDomainsDiscovered: 0
  };
  let searchCompleted = true;
  let errorMessage: string | undefined;

  if (!apiKey) {
    searchCompleted = false;
    errorMessage = uiCopy.errors.searchFailed;
    batch.apiErrors.push({ message: "BRAVE_SEARCH_API_KEY is missing." });
  } else {
    const fetcher = options.fetcher ?? fetch;
    batch = await collectQualifiedBatch(parsedQuery, cursor, apiKey, fetcher, Boolean(options.forceRefresh));
    if (batch.braveRequestCount > 0 && batch.braveResponseCount === 0 && batch.apiErrors.length > 0) {
      searchCompleted = false;
      errorMessage = uiCopy.errors.searchFailed;
    }
  }

  const hasMore = Boolean(apiKey) && searchCompleted && cursorHasMore(cursor);
  const nextCursor = hasMore ? encodeCursor(cursor) : undefined;
  const count = options.cursor ? cursor.emittedListingIds.length : batch.webResults.length;
  const visibleCount = options.cursor ? cursor.emittedListingIds.length : batch.webResults.length;
  const diagnostics: SearchDiagnostics = {
    originalQuery: query,
    canonicalQuery: canonicalSearchQuery(parsedQuery),
    queryVariants: generatedQueries,
    braveRequestCount: batch.braveRequestCount,
    braveResponseCount: batch.braveResponseCount,
    rawCandidateCount: batch.candidateCount,
    duplicateCount: batch.duplicateCount,
    rejectedCount: batch.rejectedCount,
    qualifiedCount: batch.qualifiedCount,
    apiErrors: batch.apiErrors,
    rejectionReasons: batch.rejectionReasons,
    metadataFetchAttempts: batch.metadataFetchAttempts,
    metadataFetchSuccesses: batch.metadataFetchSuccesses,
    jsonLdOfferPricesExtracted: batch.jsonLdOfferPricesExtracted,
    searchRichResultPricesExtracted: batch.searchRichResultPricesExtracted,
    fallbackPriceLabelsUsed: batch.fallbackPriceLabelsUsed,
    rejectedPriceCandidates: batch.rejectedPriceCandidates,
    sourceSpecificParserErrors: batch.sourceSpecificParserErrors,
    directAdapterRequestCount: batch.directAdapterRequestCount,
    directAdapterListingCount: batch.directAdapterListingCount,
    soldOrUnavailableRemoved: batch.soldOrUnavailableRemoved,
    unknownDomainsDiscovered: batch.unknownDomainsDiscovered
  };
  const response: WebSearchResponse = {
    query,
    parsedQuery,
    generatedQueries,
    webResults: batch.webResults,
    count,
    hasMore,
    nextCursor,
    candidateCount: batch.candidateCount,
    qualifiedCount: batch.qualifiedCount,
    rejectedCount: batch.rejectedCount,
    checkedTimestamp: new Date(now).toISOString(),
    summary: searchCompleted
      ? hasMore
        ? uiCopy.results.likelyMatchesFoundSoFar(visibleCount)
        : uiCopy.results.likelyMatchesFound(visibleCount)
      : uiCopy.errors.searchFailed,
    shortcuts: platformShortcuts(query),
    apiConfigured: Boolean(apiKey),
    searchCompleted,
    errorMessage,
    diagnostics: process.env.NODE_ENV === "production" ? undefined : diagnostics
  };

  if (!options.cursor && searchCompleted) {
    searchCache.set(cacheKey, {
      expiresAt: now + ttlSeconds * 1000,
      response
    });
  }

  return response;
}
