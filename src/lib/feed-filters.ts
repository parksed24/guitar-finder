import type { ListingImage } from "./listing-images";

export type ListingSourceType =
  | "retailer"
  | "boutique"
  | "marketplace"
  | "local-classified"
  | "forum-classified"
  | "international-retailer";

export type ListingCondition = "new" | "mint" | "excellent" | "very-good" | "good";
export type FreshnessStatus = "recently-checked" | "availability-unverified" | "possibly-stale";
export type SortOption =
  | "recommended"
  | "total-low"
  | "total-high"
  | "item-low"
  | "distance"
  | "newest"
  | "recently-checked";

export interface UserSearchLocation {
  postalCode: string;
  city?: string;
  region?: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface UnifiedFeedListing {
  id: string;
  sourceName: string;
  sourceDomain: string;
  sourceType: ListingSourceType;
  title: string;
  url: string;
  imageUrl?: string;
  primaryImage?: ListingImage;
  galleryImages?: ListingImage[];
  condition?: ListingCondition;
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  localPickup?: boolean;
  shipsToUser?: boolean;
  country?: string;
  itemPrice?: number;
  shipping?: number;
  estimatedTax?: number;
  estimatedImport?: number;
  totalEstimatedCost?: number;
  totalCostComplete: boolean;
  financingAvailable?: boolean;
  offersAccepted?: boolean;
  returnsAccepted?: boolean;
  exactMatchConfidence: number;
  buyabilityScore: number;
  freshnessConfidence: number;
  freshnessStatus: FreshnessStatus;
  checkedAt?: string;
  createdAt?: string;
}

export interface FeedFilters {
  priceMin?: number;
  priceMax?: number;
  priceMode: "total" | "item";
  includeIncompleteCost: boolean;
  distance: "any" | "25" | "50" | "100" | "250" | "local";
  searchLocation?: UserSearchLocation;
  includeUnknownDistance: boolean;
  conditions: ListingCondition[];
  listingTypes: ListingSourceType[];
  shipsToMe: boolean;
  localPickupAvailable: boolean;
  usListings: boolean;
  internationalListings: boolean;
  includeUnknownImportCost: boolean;
  priceVisible: boolean;
  totalEstimatedCostAvailable: boolean;
  financingAvailable: boolean;
  offersAccepted: boolean;
  returnsAccepted: boolean;
  recentlyChecked: boolean;
  inStockOnly: boolean;
  excludePossiblyStale: boolean;
  individualListingOnly: boolean;
}

export const defaultSearchLocation: UserSearchLocation = {
  postalCode: "28036",
  city: "Davidson",
  region: "NC",
  country: "US",
  latitude: 35.4993,
  longitude: -80.8487
};

export const defaultFeedFilters: FeedFilters = {
  priceMode: "total",
  includeIncompleteCost: true,
  distance: "any",
  searchLocation: defaultSearchLocation,
  includeUnknownDistance: true,
  conditions: [],
  listingTypes: [],
  shipsToMe: false,
  localPickupAvailable: false,
  usListings: false,
  internationalListings: false,
  includeUnknownImportCost: true,
  priceVisible: false,
  totalEstimatedCostAvailable: false,
  financingAvailable: false,
  offersAccepted: false,
  returnsAccepted: false,
  recentlyChecked: false,
  inStockOnly: false,
  excludePossiblyStale: false,
  individualListingOnly: false
};

export const sortLabels: Record<SortOption, string> = {
  recommended: "Recommended",
  "total-low": "Total estimated cost: low to high",
  "total-high": "Total estimated cost: high to low",
  "item-low": "Item price: low to high",
  distance: "Distance: nearest first",
  newest: "Newest listings",
  "recently-checked": "Recently checked"
};

export function clearFeedFilters(): FeedFilters {
  return { ...defaultFeedFilters, conditions: [], listingTypes: [], searchLocation: { ...defaultSearchLocation } };
}

function selectedPrice(listing: UnifiedFeedListing, filters: FeedFilters) {
  return filters.priceMode === "total" ? listing.totalEstimatedCost : listing.itemPrice;
}

function hasCostForMode(listing: UnifiedFeedListing, filters: FeedFilters) {
  return filters.priceMode === "total" ? listing.totalCostComplete && listing.totalEstimatedCost !== undefined : listing.itemPrice !== undefined;
}

export function haversineMiles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const radius = 3958.8;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function listingDistanceMiles(listing: UnifiedFeedListing, location = defaultSearchLocation) {
  if (listing.distanceMiles !== undefined) return listing.distanceMiles;
  if (listing.latitude === undefined || listing.longitude === undefined || location.latitude === undefined || location.longitude === undefined) return undefined;
  return haversineMiles({ latitude: location.latitude, longitude: location.longitude }, { latitude: listing.latitude, longitude: listing.longitude });
}

export function filterFeedListings(listings: UnifiedFeedListing[], filters: FeedFilters) {
  return listings.filter(listing => {
    const price = selectedPrice(listing, filters);
    const hasCost = hasCostForMode(listing, filters);
    const hasPriceFilter = filters.priceMin !== undefined || filters.priceMax !== undefined;

    if (hasPriceFilter && !hasCost) return filters.includeIncompleteCost;
    if (hasPriceFilter && price !== undefined) {
      if (filters.priceMin !== undefined && price < filters.priceMin) return false;
      if (filters.priceMax !== undefined && price > filters.priceMax) return false;
    }

    if (filters.distance !== "any") {
      if (filters.distance === "local") {
        if (!listing.localPickup) return false;
      } else {
        const distance = listingDistanceMiles(listing, filters.searchLocation);
        if (distance === undefined) return filters.includeUnknownDistance;
        if (distance > Number(filters.distance)) return false;
      }
    }

    if (filters.conditions.length && (!listing.condition || !filters.conditions.includes(listing.condition))) return false;
    if (filters.listingTypes.length && !filters.listingTypes.includes(listing.sourceType)) return false;
    if (filters.shipsToMe && !listing.shipsToUser) return false;
    if (filters.localPickupAvailable && !listing.localPickup) return false;
    if (filters.usListings && listing.country !== "US") return false;
    if (filters.internationalListings && (!listing.country || listing.country === "US")) return false;
    if (!filters.includeUnknownImportCost && listing.estimatedImport === undefined && listing.country && listing.country !== "US") return false;
    if (filters.priceVisible && listing.itemPrice === undefined) return false;
    if (filters.totalEstimatedCostAvailable && !listing.totalCostComplete) return false;
    if (filters.financingAvailable && !listing.financingAvailable) return false;
    if (filters.offersAccepted && !listing.offersAccepted) return false;
    if (filters.returnsAccepted && !listing.returnsAccepted) return false;
    if (filters.recentlyChecked && listing.freshnessStatus !== "recently-checked") return false;
    if (filters.inStockOnly && listing.freshnessStatus !== "recently-checked") return false;
    if (filters.excludePossiblyStale && listing.freshnessStatus === "possibly-stale") return false;
    if (filters.individualListingOnly && listing.buyabilityScore < 0.9) return false;

    return true;
  });
}

function metadataCompleteness(listing: UnifiedFeedListing) {
  let score = 0;
  if (listing.primaryImage?.url || listing.imageUrl) score += 0.22;
  if (listing.itemPrice !== undefined) score += 0.2;
  if (listing.totalCostComplete) score += 0.16;
  if (listing.condition) score += 0.12;
  if (listing.locationLabel || listing.distanceMiles !== undefined) score += 0.12;
  if (listing.shipsToUser || listing.localPickup) score += 0.1;
  if (listing.checkedAt || listing.createdAt) score += 0.08;
  return Math.min(1, score);
}

function freshnessConfidence(listing: UnifiedFeedListing) {
  if (listing.freshnessConfidence !== undefined) return listing.freshnessConfidence;
  if (listing.freshnessStatus === "recently-checked") return 1;
  if (listing.freshnessStatus === "availability-unverified") return 0.55;
  return 0.16;
}

function sourceQuality(listing: UnifiedFeedListing) {
  if (listing.sourceType === "retailer" || listing.sourceType === "boutique") return 0.86;
  if (listing.sourceType === "marketplace") return 0.74;
  if (listing.sourceType === "forum-classified" || listing.sourceType === "local-classified") return 0.62;
  return 0.68;
}

function totalCostCompleteness(listing: UnifiedFeedListing) {
  return listing.totalCostComplete ? 1 : listing.itemPrice !== undefined ? 0.4 : 0;
}

function distanceRelevance(listing: UnifiedFeedListing, filters: FeedFilters) {
  const distance = listingDistanceMiles(listing, filters.searchLocation);
  if (distance === undefined) return filters.includeUnknownDistance ? 0.35 : 0;
  if (distance <= 25) return 1;
  if (distance <= 100) return 0.72;
  if (distance <= 250) return 0.45;
  return 0.18;
}

export function recommendedScore(listing: UnifiedFeedListing, filters: FeedFilters = defaultFeedFilters) {
  const hasNumericPrice = listing.itemPrice !== undefined ? 1 : 0;
  const hasSourceBackedImage = listing.primaryImage?.url || listing.imageUrl ? 1 : 0;
  void filters;
  return (
    listing.exactMatchConfidence * 38 +
    listing.buyabilityScore * 22 +
    metadataCompleteness(listing) * 14 +
    freshnessConfidence(listing) * 10 +
    sourceQuality(listing) * 6 +
    hasNumericPrice * 5 +
    hasSourceBackedImage * 5
  );
}

function timeValue(value?: string) {
  return value ? Date.parse(value) || 0 : 0;
}

export function sortFeedListings(listings: UnifiedFeedListing[], sort: SortOption, filters: FeedFilters = defaultFeedFilters) {
  const copy = [...listings];
  const highNumber = Number.MAX_SAFE_INTEGER;

  return copy.sort((a, b) => {
    if (sort === "recommended") return recommendedScore(b, filters) - recommendedScore(a, filters);
    if (sort === "total-low") return (a.totalEstimatedCost ?? highNumber) - (b.totalEstimatedCost ?? highNumber);
    if (sort === "total-high") return (b.totalEstimatedCost ?? -1) - (a.totalEstimatedCost ?? -1);
    if (sort === "item-low") return (a.itemPrice ?? highNumber) - (b.itemPrice ?? highNumber);
    if (sort === "distance") return (listingDistanceMiles(a, filters.searchLocation) ?? highNumber) - (listingDistanceMiles(b, filters.searchLocation) ?? highNumber);
    if (sort === "newest") return timeValue(b.createdAt) - timeValue(a.createdAt);
    if (sort === "recently-checked") return timeValue(b.checkedAt) - timeValue(a.checkedAt);
    return 0;
  });
}

export function applyFeedFiltersAndSort(listings: UnifiedFeedListing[], filters: FeedFilters, sort: SortOption) {
  return sortFeedListings(filterFeedListings(listings, filters), sort, filters);
}

export interface ActiveFilterChip {
  id: string;
  label: string;
}

export function activeFilterChips(filters: FeedFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  if (filters.priceMin !== undefined) chips.push({ id: "priceMin", label: `Min $${filters.priceMin.toLocaleString()}` });
  if (filters.priceMax !== undefined) chips.push({ id: "priceMax", label: `Under $${filters.priceMax.toLocaleString()}` });
  if (filters.priceMode === "item") chips.push({ id: "priceMode", label: "Item price only" });
  if (!filters.includeIncompleteCost) chips.push({ id: "includeIncompleteCost", label: "Complete cost only" });
  if (filters.distance !== "any") chips.push({ id: "distance", label: filters.distance === "local" ? "Local pickup only" : `Within ${filters.distance} miles` });
  if (!filters.includeUnknownDistance) chips.push({ id: "includeUnknownDistance", label: "Known distance only" });
  filters.conditions.forEach(condition => chips.push({ id: `condition:${condition}`, label: condition.replace("-", " ") }));
  filters.listingTypes.forEach(type => chips.push({ id: `type:${type}`, label: type.replace("-", " ") }));
  if (filters.shipsToMe) chips.push({ id: "shipsToMe", label: "Ships to me" });
  if (filters.localPickupAvailable) chips.push({ id: "localPickupAvailable", label: "Local pickup" });
  if (filters.usListings) chips.push({ id: "usListings", label: "US listings" });
  if (filters.internationalListings) chips.push({ id: "internationalListings", label: "International" });
  if (!filters.includeUnknownImportCost) chips.push({ id: "includeUnknownImportCost", label: "Known import cost" });
  if (filters.priceVisible) chips.push({ id: "priceVisible", label: "Price visible" });
  if (filters.totalEstimatedCostAvailable) chips.push({ id: "totalEstimatedCostAvailable", label: "Total cost available" });
  if (filters.financingAvailable) chips.push({ id: "financingAvailable", label: "Financing" });
  if (filters.offersAccepted) chips.push({ id: "offersAccepted", label: "Offers accepted" });
  if (filters.returnsAccepted) chips.push({ id: "returnsAccepted", label: "Returns accepted" });
  if (filters.recentlyChecked) chips.push({ id: "recentlyChecked", label: "Recently checked" });
  if (filters.inStockOnly) chips.push({ id: "inStockOnly", label: "In stock" });
  if (filters.excludePossiblyStale) chips.push({ id: "excludePossiblyStale", label: "Hide older results" });
  if (filters.individualListingOnly) chips.push({ id: "individualListingOnly", label: "Single-guitar listings only" });
  return chips;
}

export function removeFilterChip(filters: FeedFilters, chipId: string): FeedFilters {
  const next: FeedFilters = { ...filters, conditions: [...filters.conditions], listingTypes: [...filters.listingTypes] };
  if (chipId === "priceMin") next.priceMin = undefined;
  else if (chipId === "priceMax") next.priceMax = undefined;
  else if (chipId === "priceMode") next.priceMode = "total";
  else if (chipId === "includeIncompleteCost") next.includeIncompleteCost = true;
  else if (chipId === "distance") next.distance = "any";
  else if (chipId === "includeUnknownDistance") next.includeUnknownDistance = true;
  else if (chipId.startsWith("condition:")) next.conditions = next.conditions.filter(value => value !== chipId.slice("condition:".length));
  else if (chipId.startsWith("type:")) next.listingTypes = next.listingTypes.filter(value => value !== chipId.slice("type:".length));
  else if (chipId in next && typeof next[chipId as keyof FeedFilters] === "boolean") {
    (next as unknown as Record<string, boolean>)[chipId] = chipId === "includeUnknownImportCost";
  }
  return next;
}
