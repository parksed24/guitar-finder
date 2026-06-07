import type { UnifiedSourceType } from "./web-search";

export type RegistrySourceType =
  | "large-retailer"
  | "used-retailer"
  | "boutique-retailer"
  | "international-retailer"
  | "marketplace"
  | "classified"
  | "forum-classified"
  | "unknown-retailer";

export type AcquisitionMode =
  | "official-api"
  | "approved-adapter"
  | "targeted-web-search"
  | "broad-web-discovery"
  | "external-link-only";

export interface SourceRegistryEntry {
  id: string;
  domain: string;
  displayName: string;
  sourceType: RegistrySourceType;
  acquisitionMode: AcquisitionMode;
  enabled: boolean;
  allowMetadataFetch: boolean;
  allowJsonLdExtraction: boolean;
  allowOpenGraphExtraction: boolean;
  allowEmbeddedProductJson: boolean;
  productPathPatterns?: string[];
  searchPathPatterns?: string[];
  blockedPathPatterns?: string[];
  soldSignals?: string[];
  activeSignals?: string[];
  supportsInternationalShipping?: boolean;
  sourceQualityScore: number;
}

export interface SourceDiscoveryCandidate {
  domain: string;
  exampleUrls: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  discoveryCount: number;
  inferredCountry?: string;
  inferredPlatform?: string;
  reviewStatus: "new" | "approved" | "ignored" | "needs-review";
}

export interface ListingAvailabilityResult {
  isAvailable: boolean;
  status: "active" | "sold" | "ended" | "archived" | "removed" | "out-of-stock" | "unknown";
  evidence: string[];
  confidence: number;
}

const sharedSoldSignals = [
  "sold",
  "this item is sold",
  "listing has ended",
  "listing ended",
  "ended",
  "archived",
  "removed",
  "no longer available",
  "item unavailable",
  "out of stock"
];

const sharedActiveSignals = [
  "for sale",
  "buy now",
  "add to cart",
  "in stock",
  "available",
  "used",
  "new"
];

export const sourceRegistry: SourceRegistryEntry[] = [
  {
    id: "reverb",
    domain: "reverb.com",
    displayName: "Reverb",
    sourceType: "marketplace",
    acquisitionMode: "targeted-web-search",
    enabled: true,
    allowMetadataFetch: true,
    allowJsonLdExtraction: true,
    allowOpenGraphExtraction: true,
    allowEmbeddedProductJson: true,
    productPathPatterns: ["/item/"],
    searchPathPatterns: ["/marketplace", "/search"],
    blockedPathPatterns: ["/price-guide", "/news", "/articles", "/shop/", "/page/"],
    soldSignals: sharedSoldSignals,
    activeSignals: sharedActiveSignals,
    supportsInternationalShipping: true,
    sourceQualityScore: 0.92
  },
  {
    id: "ebay",
    domain: "ebay.com",
    displayName: "eBay",
    sourceType: "marketplace",
    acquisitionMode: "official-api",
    enabled: true,
    allowMetadataFetch: true,
    allowJsonLdExtraction: true,
    allowOpenGraphExtraction: true,
    allowEmbeddedProductJson: true,
    productPathPatterns: ["/itm/"],
    searchPathPatterns: ["/sch/"],
    soldSignals: sharedSoldSignals,
    activeSignals: sharedActiveSignals,
    supportsInternationalShipping: true,
    sourceQualityScore: 0.88
  },
  {
    id: "sweetwater-new",
    domain: "sweetwater.com",
    displayName: "Sweetwater",
    sourceType: "large-retailer",
    acquisitionMode: "targeted-web-search",
    enabled: true,
    allowMetadataFetch: true,
    allowJsonLdExtraction: true,
    allowOpenGraphExtraction: true,
    allowEmbeddedProductJson: true,
    productPathPatterns: ["/store/detail/"],
    searchPathPatterns: ["/c", "/shop"],
    blockedPathPatterns: ["/used"],
    soldSignals: sharedSoldSignals,
    activeSignals: sharedActiveSignals,
    sourceQualityScore: 0.84
  },
  {
    id: "sweetwater-gear-exchange",
    domain: "sweetwater.com",
    displayName: "Sweetwater Gear Exchange",
    sourceType: "marketplace",
    acquisitionMode: "targeted-web-search",
    enabled: true,
    allowMetadataFetch: true,
    allowJsonLdExtraction: true,
    allowOpenGraphExtraction: true,
    allowEmbeddedProductJson: true,
    productPathPatterns: ["/used/listings/", "/used/items/"],
    searchPathPatterns: ["/used/search", "/used?"],
    soldSignals: sharedSoldSignals,
    activeSignals: sharedActiveSignals,
    sourceQualityScore: 0.82
  },
  {
    id: "guitar-center-new",
    domain: "guitarcenter.com",
    displayName: "Guitar Center",
    sourceType: "large-retailer",
    acquisitionMode: "targeted-web-search",
    enabled: true,
    allowMetadataFetch: true,
    allowJsonLdExtraction: true,
    allowOpenGraphExtraction: true,
    allowEmbeddedProductJson: true,
    productPathPatterns: ["/product/"],
    searchPathPatterns: ["/search", "/Electric-Guitars.gc"],
    blockedPathPatterns: ["/used"],
    soldSignals: sharedSoldSignals,
    activeSignals: sharedActiveSignals,
    sourceQualityScore: 0.78
  },
  {
    id: "guitar-center-used",
    domain: "guitarcenter.com",
    displayName: "Guitar Center Used",
    sourceType: "used-retailer",
    acquisitionMode: "targeted-web-search",
    enabled: true,
    allowMetadataFetch: true,
    allowJsonLdExtraction: true,
    allowOpenGraphExtraction: true,
    allowEmbeddedProductJson: true,
    productPathPatterns: ["/Used/", "/used/"],
    searchPathPatterns: ["/Used", "/search"],
    soldSignals: sharedSoldSignals,
    activeSignals: sharedActiveSignals,
    sourceQualityScore: 0.78
  },
  source("zzounds", "zzounds.com", "zZounds", "large-retailer", ["/item--", "/product/"], ["/search"]),
  source("musicians-friend", "musiciansfriend.com", "Musician's Friend", "large-retailer", ["/guitars/", "/product/"], ["/search"]),
  source("american-musical", "americanmusical.com", "American Musical Supply", "large-retailer", ["/", "/item--"], ["/search"]),
  source("chicago-music-exchange", "chicagomusicexchange.com", "Chicago Music Exchange", "boutique-retailer", ["/products/"], ["/search"]),
  source("wildwood", "wildwoodguitars.com", "Wildwood Guitars", "boutique-retailer", ["/product/"], ["/search"]),
  source("ish", "ish.guitars", "Ish Guitars", "boutique-retailer", ["/products/"], ["/search"]),
  source("matts-music", "mattsmusic.com", "Matt's Music", "boutique-retailer", ["/products/"], ["/search"]),
  source("daves-guitar", "davesguitar.com", "Dave's Guitar Shop", "boutique-retailer", ["/products/"], ["/search"]),
  source("axe-palace", "theaxepalace.com", "Axe Palace", "boutique-retailer", ["/products/"], ["/search"]),
  source("music-zoo", "themusiczoo.com", "The Music Zoo", "boutique-retailer", ["/products/"], ["/search"]),
  source("thomann", "thomannmusic.com", "Thomann", "international-retailer", ["/"], ["/search"], true),
  source("andertons", "andertons.co.uk", "Andertons", "international-retailer", ["/p/"], ["/search"], true),
  source("peach", "peachguitars.com", "Peach Guitars", "international-retailer", ["/products/"], ["/search"], true),
  source("ishibashi", "ishibashi.co.jp", "Ishibashi", "international-retailer", ["/ec/product/"], ["/search"], true),
  source("gas-station", "gasstationguitars.com", "Gas Station Guitars", "international-retailer", ["/products/"], ["/search"], true),
  {
    id: "craigslist",
    domain: "craigslist.org",
    displayName: "Craigslist",
    sourceType: "classified",
    acquisitionMode: "targeted-web-search",
    enabled: true,
    allowMetadataFetch: true,
    allowJsonLdExtraction: true,
    allowOpenGraphExtraction: true,
    allowEmbeddedProductJson: false,
    productPathPatterns: [".html"],
    searchPathPatterns: ["/search/"],
    soldSignals: sharedSoldSignals,
    activeSignals: sharedActiveSignals,
    sourceQualityScore: 0.62
  },
  {
    id: "facebook-marketplace",
    domain: "facebook.com",
    displayName: "Facebook Marketplace",
    sourceType: "classified",
    acquisitionMode: "external-link-only",
    enabled: true,
    allowMetadataFetch: false,
    allowJsonLdExtraction: false,
    allowOpenGraphExtraction: false,
    allowEmbeddedProductJson: false,
    productPathPatterns: ["/marketplace/item/"],
    searchPathPatterns: ["/marketplace/search"],
    soldSignals: sharedSoldSignals,
    activeSignals: sharedActiveSignals,
    sourceQualityScore: 0.55
  },
  {
    id: "the-gear-page",
    domain: "thegearpage.net",
    displayName: "The Gear Page Guitar Emporium",
    sourceType: "forum-classified",
    acquisitionMode: "targeted-web-search",
    enabled: true,
    allowMetadataFetch: true,
    allowJsonLdExtraction: false,
    allowOpenGraphExtraction: true,
    allowEmbeddedProductJson: false,
    productPathPatterns: ["/board/index.php?threads/"],
    searchPathPatterns: ["/board/index.php?search/"],
    soldSignals: [...sharedSoldSignals, "closed", "gone"],
    activeSignals: ["fs", "for sale", "obo", "shipped", "paypal"],
    sourceQualityScore: 0.58
  }
];

function source(
  id: string,
  domain: string,
  displayName: string,
  sourceType: RegistrySourceType,
  productPathPatterns: string[],
  searchPathPatterns: string[],
  supportsInternationalShipping = false
): SourceRegistryEntry {
  return {
    id,
    domain,
    displayName,
    sourceType,
    acquisitionMode: "targeted-web-search",
    enabled: true,
    allowMetadataFetch: true,
    allowJsonLdExtraction: true,
    allowOpenGraphExtraction: true,
    allowEmbeddedProductJson: true,
    productPathPatterns,
    searchPathPatterns,
    soldSignals: sharedSoldSignals,
    activeSignals: sharedActiveSignals,
    supportsInternationalShipping,
    sourceQualityScore: sourceType === "international-retailer" ? 0.74 : sourceType === "boutique-retailer" ? 0.8 : 0.76
  };
}

const discoveryQueue = new Map<string, SourceDiscoveryCandidate>();

export function domainFromListingUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "unknown";
  }
}

export function pathFromListingUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function domainMatches(candidate: string, entry: SourceRegistryEntry) {
  return candidate === entry.domain || candidate.endsWith(`.${entry.domain}`);
}

export function sourceForUrl(url: string) {
  const domain = domainFromListingUrl(url);
  const path = pathFromListingUrl(url);
  const matches = sourceRegistry.filter(entry => entry.enabled && domainMatches(domain, entry));
  if (!matches.length) return undefined;
  const specific = matches.find(entry => entry.productPathPatterns?.some(pattern => path.includes(pattern.toLowerCase())));
  return specific ?? matches[0];
}

export function isKnownSourceDomain(domain: string) {
  const clean = domain.replace(/^www\./, "").toLowerCase();
  return sourceRegistry.some(entry => domainMatches(clean, entry));
}

export function displayNameForUrl(url: string) {
  const entry = sourceForUrl(url);
  if (entry) return entry.displayName;
  const domain = domainFromListingUrl(url).split(".");
  return domain[0] ? domain[0][0].toUpperCase() + domain[0].slice(1) : undefined;
}

export function sourceTypeForRegistryEntry(entry: SourceRegistryEntry | undefined): UnifiedSourceType {
  if (!entry) return "retailer";
  if (entry.sourceType === "boutique-retailer") return "boutique";
  if (entry.sourceType === "marketplace") return "marketplace";
  if (entry.sourceType === "classified") return "classified";
  if (entry.sourceType === "forum-classified") return "forum-classified";
  if (entry.sourceType === "international-retailer") return "international-retailer";
  return "retailer";
}

export function sourceTypeForListingUrl(url: string): UnifiedSourceType {
  return sourceTypeForRegistryEntry(sourceForUrl(url));
}

export function targetedSearchScopes() {
  return sourceRegistry
    .filter(entry => entry.enabled && (entry.acquisitionMode === "targeted-web-search" || entry.acquisitionMode === "official-api"))
    .map(entry => entry.id === "sweetwater-gear-exchange" ? "sweetwater.com/used" : entry.id === "guitar-center-used" ? "guitarcenter.com/Used" : entry.domain);
}

export function targetedSourceRows() {
  return sourceRegistry.map(entry => ({
    ...entry,
    health: entry.acquisitionMode === "official-api" ? "Needs credentials for live API checks" : entry.enabled ? "Targeted search enabled" : "Disabled",
    searchesAttempted: 0,
    candidatesReturned: 0,
    listingsQualified: 0,
    listingsRejected: 0,
    soldListingsRemoved: 0,
    listingsWithNumericPrices: 0,
    listingsWithImages: 0,
    unknownDomainsDiscovered: discoveryQueue.size
  }));
}

export function isMarketplaceItemUrlByRegistry(url: string) {
  const path = pathFromListingUrl(url);
  const entry = sourceForUrl(url);
  return Boolean(entry?.productPathPatterns?.some(pattern => path.includes(pattern.toLowerCase())));
}

export function isSearchOrLandingUrl(url: string, text = "") {
  const value = url.toLowerCase();
  const path = pathFromListingUrl(url);
  const entry = sourceForUrl(url);
  const normalized = normalize(text);
  if (/wikipedia\.org|youtube\.com|youtu\.be|reddit\.com/.test(value)) return true;
  if (/\b(review|history|wiki|buyers guide|price guide|valuation|specs only)\b/.test(normalized)) return true;
  if (entry?.blockedPathPatterns?.some(pattern => path.includes(pattern.toLowerCase()))) return true;
  if (entry?.searchPathPatterns?.some(pattern => path.includes(pattern.toLowerCase()))) {
    return !entry.productPathPatterns?.some(pattern => path.includes(pattern.toLowerCase()));
  }
  if (/\/(?:search|category|categories|collections|marketplace)(?:[/?#]|$)/i.test(value)) return true;
  if (/\/(?:electric-guitars|guitars)(?:[/?#]|$)/i.test(value) && !isMarketplaceItemUrlByRegistry(url)) return true;
  return false;
}

export function assessListingAvailability(text = "", url = "", structuredAvailability?: string): ListingAvailabilityResult {
  const entry = sourceForUrl(url);
  const normalized = normalize(`${structuredAvailability ?? ""} ${text}`);
  const soldSignals = entry?.soldSignals ?? sharedSoldSignals;
  const activeSignals = entry?.activeSignals ?? sharedActiveSignals;
  const evidence = soldSignals.filter(signal => normalized.includes(normalize(signal)));

  const endedDate = normalized.match(/\b(?:ended|end date|item end date)\s*:?\s*(\d{4}-\d{2}-\d{2})\b/)?.[1];
  if (endedDate && Date.parse(endedDate) < Date.now()) evidence.push(`ended ${endedDate}`);

  if (evidence.length) {
    const joined = evidence.join(" ");
    const status: ListingAvailabilityResult["status"] = /out of stock/.test(joined) ? "out-of-stock"
      : /archiv/.test(joined) ? "archived"
        : /removed/.test(joined) ? "removed"
          : /ended|listing has ended/.test(joined) ? "ended"
            : "sold";
    return { isAvailable: false, status, evidence, confidence: 0.92 };
  }

  const activeEvidence = activeSignals.filter(signal => normalized.includes(normalize(signal)));
  if (activeEvidence.length) return { isAvailable: true, status: "active", evidence: activeEvidence, confidence: 0.72 };
  return { isAvailable: true, status: "unknown", evidence: [], confidence: 0.35 };
}

export function recordSourceDiscoveryCandidate(url: string, now = Date.now()) {
  const domain = domainFromListingUrl(url);
  if (!domain || domain === "unknown" || isKnownSourceDomain(domain)) return undefined;
  const timestamp = new Date(now).toISOString();
  const existing = discoveryQueue.get(domain);
  if (existing) {
    existing.lastSeenAt = timestamp;
    existing.discoveryCount += 1;
    if (!existing.exampleUrls.includes(url)) existing.exampleUrls = [...existing.exampleUrls.slice(-4), url];
    return existing;
  }
  const candidate: SourceDiscoveryCandidate = {
    domain,
    exampleUrls: [url],
    firstSeenAt: timestamp,
    lastSeenAt: timestamp,
    discoveryCount: 1,
    inferredCountry: inferCountry(domain),
    inferredPlatform: "retailer",
    reviewStatus: "new"
  };
  discoveryQueue.set(domain, candidate);
  return candidate;
}

export function getSourceDiscoveryCandidates() {
  return Array.from(discoveryQueue.values()).sort((a, b) => b.discoveryCount - a.discoveryCount);
}

export function clearSourceDiscoveryCandidates() {
  discoveryQueue.clear();
}

function inferCountry(domain: string) {
  if (domain.endsWith(".co.uk")) return "UK";
  if (domain.endsWith(".jp")) return "Japan";
  if (domain.endsWith(".de")) return "Germany";
  if (domain.endsWith(".ca")) return "Canada";
  return undefined;
}

function normalize(value: string | undefined) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9$.,:/-]+/g, " ").trim();
}
