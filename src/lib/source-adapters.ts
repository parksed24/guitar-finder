import { mergeListingMetadata, type ListingMetadataFragment } from "./listing-enrichment";
import type { ParsedGuitarSearch, WebSearchResult } from "./web-search";
import { assessListingAvailability, displayNameForUrl, domainFromListingUrl, sourceForUrl, sourceTypeForListingUrl } from "./source-registry";

export interface CanonicalGuitarSearch {
  originalQuery: string;
  brand?: string;
  model?: string;
  family?: string;
  finish?: string;
  requiredTerms: string[];
  exclusionTerms: string[];
}

export interface SourceListingResult {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  itemPrice?: number;
  currency?: string;
  sellerName?: string;
  locationLabel?: string;
  condition?: string;
  shippingLabel?: string;
  availability?: string;
  endDate?: string;
  sourceName?: string;
  sourceDomain?: string;
}

export interface SourceSearchResponse {
  sourceId: string;
  listings: SourceListingResult[];
  nextCursor?: string;
  searchedAliases: string[];
  errors: string[];
}

export interface SourceHealthReport {
  sourceId: string;
  configured: boolean;
  healthy: boolean;
  lastSuccessfulRequest?: string;
  lastError?: string;
}

export interface ListingSourceAdapter {
  sourceId: string;
  search(request: CanonicalGuitarSearch, cursor?: string): Promise<SourceSearchResponse>;
  enrich(listing: SourceListingResult): Promise<ListingMetadataFragment[]>;
  healthCheck(): Promise<SourceHealthReport>;
}

export interface SearchOrchestrator {
  search(request: CanonicalGuitarSearch): Promise<UnifiedSearchResponse>;
}

export interface UnifiedSearchResponse {
  listings: WebSearchResult[];
  sourceResponses: SourceSearchResponse[];
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

interface EbayAdapterOptions {
  env?: Record<string, string | undefined>;
  fetcher?: Fetcher;
  now?: number;
}

interface EbayTokenResponse {
  access_token?: string;
  expires_in?: number;
  error_description?: string;
}

interface EbayItemSummary {
  itemId?: string;
  title?: string;
  itemWebUrl?: string;
  image?: { imageUrl?: string };
  price?: { value?: string; currency?: string };
  seller?: { username?: string };
  itemLocation?: { city?: string; stateOrProvince?: string; country?: string };
  condition?: string;
  shippingOptions?: Array<{ shippingCost?: { value?: string; currency?: string } }>;
  itemEndDate?: string;
  estimatedAvailabilities?: Array<{ availabilityThresholdType?: string; estimatedAvailabilityStatus?: string; estimatedAvailableQuantity?: number }>;
}

interface EbayBrowseResponse {
  itemSummaries?: EbayItemSummary[];
  next?: string;
}

export class EbayBrowseAdapter implements ListingSourceAdapter {
  sourceId = "ebay";
  private env: Record<string, string | undefined>;
  private fetcher: Fetcher;
  private now: number;
  private token?: { value: string; expiresAt: number };

  constructor(options: EbayAdapterOptions = {}) {
    this.env = options.env ?? process.env;
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? Date.now();
  }

  async search(request: CanonicalGuitarSearch, cursor?: string): Promise<SourceSearchResponse> {
    const aliases = searchAliases(request);
    const configured = this.isConfigured();
    if (!configured) {
      return { sourceId: this.sourceId, listings: [], searchedAliases: aliases, errors: ["eBay Browse API is not configured."] };
    }

    const accessToken = await this.getAccessToken();
    const listings: SourceListingResult[] = [];
    const errors: string[] = [];
    const offset = Number(cursor || 0);

    for (const alias of aliases) {
      const endpoint = new URL(`${this.apiBaseUrl()}/buy/browse/v1/item_summary/search`);
      endpoint.searchParams.set("q", alias);
      endpoint.searchParams.set("limit", "50");
      endpoint.searchParams.set("offset", String(offset));
      endpoint.searchParams.set("category_ids", "3858");
      const response = await this.fetcher(endpoint.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-EBAY-C-MARKETPLACE-ID": this.env.EBAY_MARKETPLACE_ID || "EBAY_US",
          Accept: "application/json"
        }
      });
      if (!response.ok) {
        errors.push(`eBay Browse search failed with status ${response.status}`);
        continue;
      }
      const body = await response.json().catch(() => ({})) as EbayBrowseResponse;
      for (const item of body.itemSummaries ?? []) {
        const mapped = this.mapItemSummary(item);
        if (mapped) listings.push(mapped);
      }
    }

    return {
      sourceId: this.sourceId,
      listings: dedupeListings(listings),
      nextCursor: listings.length >= 50 ? String(offset + 50) : undefined,
      searchedAliases: aliases,
      errors
    };
  }

  async enrich(listing: SourceListingResult) {
    const fragments: ListingMetadataFragment[] = [];
    if (listing.itemPrice !== undefined || listing.imageUrl || listing.title) {
      fragments.push({
        source: "structured-api",
        title: listing.title,
        itemPrice: listing.itemPrice,
        currency: listing.currency,
        availability: listing.availability,
        condition: listing.condition,
        sellerName: listing.sellerName,
        locationLabel: listing.locationLabel,
        imageUrls: listing.imageUrl ? [listing.imageUrl] : [],
        confidence: 0.94
      });
    }
    return fragments;
  }

  async healthCheck(): Promise<SourceHealthReport> {
    return {
      sourceId: this.sourceId,
      configured: this.isConfigured(),
      healthy: this.isConfigured(),
      lastError: this.isConfigured() ? undefined : "Missing EBAY_CLIENT_ID or EBAY_CLIENT_SECRET."
    };
  }

  private isConfigured() {
    return Boolean(this.env.EBAY_CLIENT_ID && this.env.EBAY_CLIENT_SECRET);
  }

  private apiBaseUrl() {
    return this.env.EBAY_ENVIRONMENT === "production"
      ? "https://api.ebay.com"
      : "https://api.sandbox.ebay.com";
  }

  private async getAccessToken() {
    if (this.token && this.token.expiresAt > this.now + 60_000) return this.token.value;
    const clientId = this.env.EBAY_CLIENT_ID;
    const clientSecret = this.env.EBAY_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("eBay Browse API is not configured.");
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await this.fetcher(`${this.apiBaseUrl()}/identity/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "https://api.ebay.com/oauth/api_scope"
      })
    });
    const body = await response.json().catch(() => ({})) as EbayTokenResponse;
    if (!response.ok || !body.access_token) {
      throw new Error(body.error_description || `eBay OAuth failed with status ${response.status}`);
    }
    this.token = { value: body.access_token, expiresAt: this.now + (body.expires_in ?? 7200) * 1000 };
    return body.access_token;
  }

  private mapItemSummary(item: EbayItemSummary): SourceListingResult | undefined {
    if (!item.itemId || !item.title || !item.itemWebUrl) return undefined;
    const endDateTime = item.itemEndDate ? Date.parse(item.itemEndDate) : undefined;
    if (endDateTime !== undefined && Number.isFinite(endDateTime) && endDateTime < this.now) return undefined;
    const availabilityText = item.estimatedAvailabilities?.map(entry => `${entry.estimatedAvailabilityStatus ?? ""} ${entry.estimatedAvailableQuantity ?? ""}`).join(" ");
    const availability = assessListingAvailability(`${item.title} ${availabilityText ?? ""}`, item.itemWebUrl, availabilityText);
    if (!availability.isAvailable) return undefined;
    const location = [item.itemLocation?.city, item.itemLocation?.stateOrProvince, item.itemLocation?.country].filter(Boolean).join(", ");
    const shipping = item.shippingOptions?.[0]?.shippingCost;
    return {
      id: item.itemId,
      title: item.title,
      url: item.itemWebUrl,
      imageUrl: item.image?.imageUrl,
      itemPrice: normalizePrice(item.price?.value),
      currency: item.price?.currency,
      sellerName: item.seller?.username,
      locationLabel: location || undefined,
      condition: item.condition,
      shippingLabel: shipping?.value ? `${shipping.currency ?? item.price?.currency ?? "USD"} ${shipping.value}` : undefined,
      availability: availability.status === "active" ? "Available" : undefined,
      endDate: item.itemEndDate,
      sourceName: "eBay",
      sourceDomain: "ebay.com"
    };
  }
}

export class MetadataOnlyAdapter implements ListingSourceAdapter {
  constructor(public sourceId: string) {}

  async search(request: CanonicalGuitarSearch): Promise<SourceSearchResponse> {
    return { sourceId: this.sourceId, listings: [], searchedAliases: searchAliases(request), errors: [] };
  }

  async enrich(listing: SourceListingResult): Promise<ListingMetadataFragment[]> {
    return [{
      source: "source-adapter",
      title: listing.title,
      itemPrice: listing.itemPrice,
      currency: listing.currency,
      availability: listing.availability,
      condition: listing.condition,
      sellerName: listing.sellerName,
      locationLabel: listing.locationLabel,
      imageUrls: listing.imageUrl ? [listing.imageUrl] : [],
      confidence: 0.86
    }];
  }

  async healthCheck(): Promise<SourceHealthReport> {
    return { sourceId: this.sourceId, configured: true, healthy: true };
  }
}

export class ReverbAdapter extends MetadataOnlyAdapter {
  constructor() { super("reverb"); }
}

export class SweetwaterGearExchangeAdapter extends MetadataOnlyAdapter {
  constructor() { super("sweetwater-gear-exchange"); }
}

export class GuitarCenterUsedAdapter extends MetadataOnlyAdapter {
  constructor() { super("guitar-center-used"); }
}

export class GenericRetailerAdapter extends MetadataOnlyAdapter {
  constructor() { super("generic-retailer"); }
}

export class BroadWebDiscoveryAdapter extends MetadataOnlyAdapter {
  constructor() { super("broad-web-discovery"); }
}

export class TargetedWebSearchAdapter extends MetadataOnlyAdapter {
  constructor() { super("targeted-web-search"); }
}

export class ForumClassifiedAdapter extends MetadataOnlyAdapter {
  constructor() { super("forum-classified"); }
}

export function defaultSourceAdapters(options: EbayAdapterOptions = {}): ListingSourceAdapter[] {
  return [
    new EbayBrowseAdapter(options),
    new ReverbAdapter(),
    new SweetwaterGearExchangeAdapter(),
    new GuitarCenterUsedAdapter(),
    new GenericRetailerAdapter(),
    new BroadWebDiscoveryAdapter(),
    new TargetedWebSearchAdapter(),
    new ForumClassifiedAdapter()
  ];
}

export function parsedSearchToCanonical(request: ParsedGuitarSearch): CanonicalGuitarSearch {
  return {
    originalQuery: request.originalQuery,
    brand: request.brand,
    model: request.model,
    family: request.family,
    finish: request.finish,
    requiredTerms: request.requiredTerms,
    exclusionTerms: request.exclusionTerms
  };
}

export function sourceListingToWebResult(listing: SourceListingResult, now = Date.now()): WebSearchResult {
  const fragment: ListingMetadataFragment = {
    source: "structured-api",
    title: listing.title,
    itemPrice: listing.itemPrice,
    currency: listing.currency,
    availability: listing.availability,
    condition: listing.condition,
    sellerName: listing.sellerName,
    locationLabel: listing.locationLabel,
    imageUrls: listing.imageUrl ? [listing.imageUrl] : [],
    confidence: 0.94
  };
  const merged = mergeListingMetadata(listing.url, [fragment], now, listing.title);
  const source = sourceForUrl(listing.url);
  return {
    id: listing.url,
    title: listing.title,
    url: listing.url,
    sourceDomain: listing.sourceDomain ?? domainFromListingUrl(listing.url),
    sourceName: listing.sourceName ?? displayNameForUrl(listing.url),
    sourceType: sourceTypeForListingUrl(listing.url),
    snippet: undefined,
    possiblePrice: merged.priceLabel,
    itemPrice: merged.itemPrice,
    currency: merged.currency,
    priceLabel: merged.priceLabel,
    possibleLocation: merged.locationLabel,
    availability: merged.availability,
    condition: merged.condition,
    sellerName: merged.sellerName,
    confidence: "Likely exact match",
    exactMatchConfidence: 0.96,
    buyabilityScore: Math.max(0.84, source?.sourceQualityScore ?? 0.8),
    freshnessStatus: "recently-checked",
    extractionMethod: "structured-source",
    isPurchasablePage: true,
    thumbnailUrl: merged.primaryImage?.url,
    imageSource: merged.primaryImage ? "structured-source" : undefined,
    primaryImage: merged.primaryImage,
    galleryImages: merged.galleryImages,
    enrichmentMethod: merged.extractionMethod,
    enrichmentConfidence: merged.confidence
  };
}

function searchAliases(request: CanonicalGuitarSearch) {
  const primary = [request.brand, request.family, request.model, request.finish].filter(Boolean).join(" ") || request.originalQuery;
  return Array.from(new Set([
    primary,
    request.originalQuery,
    [request.brand, request.model, request.finish].filter(Boolean).join(" ")
  ].filter(Boolean)));
}

function normalizePrice(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed >= 100 ? parsed : undefined;
}

function dedupeListings(listings: SourceListingResult[]) {
  const seen = new Set<string>();
  return listings.filter(listing => {
    const key = listing.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
