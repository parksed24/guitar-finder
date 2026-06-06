import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  activeFilterChips,
  applyFeedFiltersAndSort,
  clearFeedFilters,
  filterFeedListings,
  removeFilterChip,
  sortFeedListings,
  type FeedFilters,
  type UnifiedFeedListing
} from "../src/lib/feed-filters";

const baseFilters = () => clearFeedFilters();

function listing(overrides: Partial<UnifiedFeedListing> = {}): UnifiedFeedListing {
  return {
    id: overrides.id ?? "base",
    sourceName: "Ish Guitars",
    sourceDomain: "ish.guitars",
    sourceType: "boutique",
    title: "Fender Custom Shop Jazzmaster",
    url: "https://example.com/listing",
    condition: "new",
    locationLabel: "Syracuse, NY",
    distanceMiles: 80,
    localPickup: false,
    shipsToUser: true,
    country: "US",
    itemPrice: 4500,
    shipping: 75,
    estimatedTax: 315,
    estimatedImport: undefined,
    totalEstimatedCost: 4890,
    totalCostComplete: true,
    financingAvailable: false,
    offersAccepted: false,
    returnsAccepted: true,
    exactMatchConfidence: 0.95,
    buyabilityScore: 0.94,
    freshnessConfidence: 1,
    freshnessStatus: "recently-checked",
    checkedAt: "2026-06-05T12:00:00.000Z",
    createdAt: "2026-06-05T11:00:00.000Z",
    ...overrides
  };
}

describe("unified feed filters and sort", () => {
  it("default filters allow all qualified exact-match listings", () => {
    const filters = baseFilters();
    const results = filterFeedListings([
      listing({ id: "new-us", condition: "new", country: "US", itemPrice: undefined, totalEstimatedCost: undefined, totalCostComplete: false, shipsToUser: undefined, returnsAccepted: false }),
      listing({ id: "used-intl", condition: "excellent", country: "Japan", estimatedImport: undefined, distanceMiles: undefined, shipsToUser: true, financingAvailable: false }),
      listing({ id: "local", sourceType: "local-classified", localPickup: true, shipsToUser: false, distanceMiles: undefined })
    ], filters);

    expect(results.map(result => result.id)).toEqual(["new-us", "used-intl", "local"]);
    expect(activeFilterChips(filters)).toEqual([]);
  });

  it("uses total estimated cost for price filtering by default", () => {
    const filters = { ...baseFilters(), priceMax: 4800 };
    const results = filterFeedListings([
      listing({ id: "low-total", itemPrice: 4600, totalEstimatedCost: 4700 }),
      listing({ id: "low-item-high-total", itemPrice: 4400, totalEstimatedCost: 5100 })
    ], filters);

    expect(results.map(result => result.id)).toEqual(["low-total"]);
  });

  it("uses item-price mode when selected", () => {
    const filters = { ...baseFilters(), priceMode: "item" as const, priceMax: 4500 };
    const results = filterFeedListings([
      listing({ id: "item-fit", itemPrice: 4400, totalEstimatedCost: 5100 }),
      listing({ id: "item-high", itemPrice: 4600, totalEstimatedCost: 4700 })
    ], filters);

    expect(results.map(result => result.id)).toEqual(["item-fit"]);
  });

  it("applies minimum and maximum price together", () => {
    const filters = { ...baseFilters(), priceMin: 4200, priceMax: 5000 };
    const results = filterFeedListings([
      listing({ id: "too-low", totalEstimatedCost: 4100 }),
      listing({ id: "inside", totalEstimatedCost: 4550 }),
      listing({ id: "too-high", totalEstimatedCost: 5200 })
    ], filters);

    expect(results.map(result => result.id)).toEqual(["inside"]);
  });

  it("includes unknown total-cost listings only when enabled", () => {
    const unknown = listing({ id: "unknown", totalEstimatedCost: undefined, totalCostComplete: false });
    const complete = listing({ id: "complete", totalEstimatedCost: 4700 });

    expect(filterFeedListings([unknown, complete], { ...baseFilters(), priceMax: 5000 }).map(result => result.id)).toEqual(["unknown", "complete"]);
    expect(filterFeedListings([unknown, complete], { ...baseFilters(), priceMax: 5000, includeIncompleteCost: false }).map(result => result.id)).toEqual(["complete"]);
  });

  it("filters distance with coordinates and simulated location", () => {
    const near = listing({ id: "near", distanceMiles: undefined, latitude: 35.55, longitude: -80.82 });
    const far = listing({ id: "far", distanceMiles: undefined, latitude: 40.71, longitude: -74.01 });
    const results = filterFeedListings([near, far], { ...baseFilters(), distance: "25" });

    expect(results.map(result => result.id)).toEqual(["near"]);
  });

  it("includes unknown-distance listings only when enabled", () => {
    const unknown = listing({ id: "unknown-distance", distanceMiles: undefined, latitude: undefined, longitude: undefined });
    const near = listing({ id: "near", distanceMiles: 10 });

    expect(filterFeedListings([unknown, near], { ...baseFilters(), distance: "25" }).map(result => result.id)).toEqual(["unknown-distance", "near"]);
    expect(filterFeedListings([unknown, near], { ...baseFilters(), distance: "25", includeUnknownDistance: false }).map(result => result.id)).toEqual(["near"]);
  });

  it("supports local-pickup-only distance filtering", () => {
    const results = filterFeedListings([
      listing({ id: "ships", localPickup: false }),
      listing({ id: "pickup", localPickup: true })
    ], { ...baseFilters(), distance: "local" });

    expect(results.map(result => result.id)).toEqual(["pickup"]);
  });

  it("supports condition multi-select filtering", () => {
    const filters = { ...baseFilters(), conditions: ["mint", "excellent"] as FeedFilters["conditions"] };
    const results = filterFeedListings([
      listing({ id: "new", condition: "new" }),
      listing({ id: "mint", condition: "mint" }),
      listing({ id: "excellent", condition: "excellent" })
    ], filters);

    expect(results.map(result => result.id)).toEqual(["mint", "excellent"]);
  });

  it("supports listing-type multi-select filtering", () => {
    const filters = { ...baseFilters(), listingTypes: ["marketplace", "forum-classified"] as FeedFilters["listingTypes"] };
    const results = filterFeedListings([
      listing({ id: "retailer", sourceType: "retailer" }),
      listing({ id: "marketplace", sourceType: "marketplace" }),
      listing({ id: "forum", sourceType: "forum-classified" })
    ], filters);

    expect(results.map(result => result.id)).toEqual(["marketplace", "forum"]);
  });

  it("filters international listings", () => {
    const results = filterFeedListings([
      listing({ id: "us", country: "US" }),
      listing({ id: "unknown", country: undefined }),
      listing({ id: "japan", country: "Japan", estimatedImport: 120 })
    ], { ...baseFilters(), internationalListings: true });

    expect(results.map(result => result.id)).toEqual(["japan"]);
  });

  it("filters ships-to-me listings", () => {
    const results = filterFeedListings([
      listing({ id: "pickup", shipsToUser: false, localPickup: true }),
      listing({ id: "ships", shipsToUser: true })
    ], { ...baseFilters(), shipsToMe: true });

    expect(results.map(result => result.id)).toEqual(["ships"]);
  });

  it("filters price-visible listings", () => {
    const results = filterFeedListings([
      listing({ id: "hidden-price", itemPrice: undefined }),
      listing({ id: "visible-price", itemPrice: 4300 })
    ], { ...baseFilters(), priceVisible: true });

    expect(results.map(result => result.id)).toEqual(["visible-price"]);
  });

  it("filters listings with complete total estimated cost", () => {
    const results = filterFeedListings([
      listing({ id: "incomplete", totalCostComplete: false, totalEstimatedCost: undefined }),
      listing({ id: "complete", totalCostComplete: true, totalEstimatedCost: 4700 })
    ], { ...baseFilters(), totalEstimatedCostAvailable: true });

    expect(results.map(result => result.id)).toEqual(["complete"]);
  });

  it("filters financing and offers", () => {
    const finance = filterFeedListings([
      listing({ id: "no-finance", financingAvailable: false }),
      listing({ id: "finance", financingAvailable: true })
    ], { ...baseFilters(), financingAvailable: true });
    const offers = filterFeedListings([
      listing({ id: "no-offers", offersAccepted: false }),
      listing({ id: "offers", offersAccepted: true })
    ], { ...baseFilters(), offersAccepted: true });

    expect(finance.map(result => result.id)).toEqual(["finance"]);
    expect(offers.map(result => result.id)).toEqual(["offers"]);
  });

  it("filters returns-accepted listings", () => {
    const results = filterFeedListings([
      listing({ id: "private-sale", returnsAccepted: false }),
      listing({ id: "returns", returnsAccepted: true })
    ], { ...baseFilters(), returnsAccepted: true });

    expect(results.map(result => result.id)).toEqual(["returns"]);
  });

  it("excludes stale results when requested", () => {
    const results = filterFeedListings([
      listing({ id: "stale", freshnessStatus: "possibly-stale" }),
      listing({ id: "current", freshnessStatus: "recently-checked" })
    ], { ...baseFilters(), excludePossiblyStale: true });

    expect(results.map(result => result.id)).toEqual(["current"]);
  });

  it("sorts by recommended without letting a stale cheap snippet outrank a complete current listing", () => {
    const sorted = sortFeedListings([
      listing({ id: "cheap-stale", itemPrice: 3000, totalEstimatedCost: undefined, totalCostComplete: false, imageUrl: undefined, exactMatchConfidence: 0.78, buyabilityScore: 0.45, freshnessConfidence: 0.16, freshnessStatus: "possibly-stale" }),
      listing({ id: "complete-current", itemPrice: 4600, totalEstimatedCost: 4990, totalCostComplete: true, exactMatchConfidence: 0.96, buyabilityScore: 0.95, freshnessConfidence: 1, freshnessStatus: "recently-checked" })
    ], "recommended", baseFilters());

    expect(sorted[0].id).toBe("complete-current");
  });

  it("sorts by total estimated cost, item price, distance, newest, and recently checked", () => {
    const list = [
      listing({ id: "a", itemPrice: 4500, totalEstimatedCost: 5000, distanceMiles: 90, createdAt: "2026-06-01T00:00:00.000Z", checkedAt: "2026-06-02T00:00:00.000Z" }),
      listing({ id: "b", itemPrice: 4200, totalEstimatedCost: 4700, distanceMiles: 30, createdAt: "2026-06-03T00:00:00.000Z", checkedAt: "2026-06-05T00:00:00.000Z" })
    ];

    expect(sortFeedListings(list, "total-low", baseFilters()).map(result => result.id)).toEqual(["b", "a"]);
    expect(sortFeedListings(list, "total-high", baseFilters()).map(result => result.id)).toEqual(["a", "b"]);
    expect(sortFeedListings(list, "item-low", baseFilters()).map(result => result.id)).toEqual(["b", "a"]);
    expect(sortFeedListings(list, "distance", baseFilters()).map(result => result.id)).toEqual(["b", "a"]);
    expect(sortFeedListings(list, "newest", baseFilters()).map(result => result.id)).toEqual(["b", "a"]);
    expect(sortFeedListings(list, "recently-checked", baseFilters()).map(result => result.id)).toEqual(["b", "a"]);
  });

  it("removes chips immediately and can clear all filters without owning the query", () => {
    const filtered = { ...baseFilters(), priceMax: 5000, conditions: ["excellent"] as FeedFilters["conditions"], distance: "100" as const };
    const chips = activeFilterChips(filtered);
    const withoutCondition = removeFilterChip(filtered, "condition:excellent");

    expect(chips.map(chip => chip.label)).toContain("Under $5,000");
    expect(withoutCondition.conditions).toEqual([]);
    expect(clearFeedFilters()).not.toHaveProperty("query");
  });

  it("applies filters before sort so detail navigation can use filtered sorted order", () => {
    const ordered = applyFeedFiltersAndSort([
      listing({ id: "hidden", condition: "new", totalEstimatedCost: 4000 }),
      listing({ id: "second", condition: "excellent", totalEstimatedCost: 4700 }),
      listing({ id: "first", condition: "excellent", totalEstimatedCost: 4300 })
    ], { ...baseFilters(), conditions: ["excellent"] as FeedFilters["conditions"] }, "total-low");

    expect(ordered.map(result => result.id)).toEqual(["first", "second"]);
  });

  it("wires reset, saved alerts, previous/next, compare, and grid/list to the active feed state", () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");

    expect(clientCode).toContain("setFinderQuery(\"\")");
    expect(clientCode).toContain("setSearchCursor(null)");
    expect(clientCode).toContain("sort: sortOption");
    expect(clientCode).toContain("filters: feedFilters");
    expect(clientCode).toContain("listingItems = exactResults.length ? visibleResults");
    expect(clientCode).toContain("comparedListings = (exactResults.length ? visibleResults");
    expect(clientCode).toContain("setActiveView(\"grid\")");
    expect(clientCode).toContain("setActiveView(\"list\")");
  });

  it("renders active filters as removable chips", () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");
    const copyCode = readFileSync("src/content/ui-copy.ts", "utf8");

    expect(clientCode).toContain("activeChips.map");
    expect(clientCode).toContain("removeChip(chip.id)");
    expect(copyCode).toContain("Clear all");
    expect(clientCode).toContain("active-filter-chip");
  });

  it("uses a dedicated compact list card without long snippets or spec paragraphs", () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");
    const listCard = clientCode.slice(clientCode.indexOf("function ListingListCard"), clientCode.indexOf("function SourcePlaceholder"));

    expect(clientCode).toContain("function ListingListCard");
    expect(listCard).toContain("list-title");
    expect(listCard).toContain("uiCopy.listing.priceOnSource");
    expect(listCard).toContain("View listing");
    expect(listCard).toContain("toUnifiedFeedListing(listing)");
    expect(listCard).not.toContain("listing.snippet");
    expect(listCard).not.toContain("listing.description");
    expect(listCard).not.toContain("conditionNotes");
    expect(listCard).not.toContain("retailerDescription");
    expect(listCard).not.toContain("TagList");
  });

  it("wires progressive pagination without resetting active view state", () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");
    const copyCode = readFileSync("src/content/ui-copy.ts", "utf8");

    expect(copyCode).toContain("Load more results");
    expect(copyCode).toContain("Searching for more guitars");
    expect(copyCode).toContain("You’ve reached the end of the available results.");
    expect(clientCode).toContain("body: JSON.stringify({ query: finderQuery.trim(), cursor: searchCursor })");
    expect(clientCode).toContain("setExactResults(previous =>");
    expect(clientCode).toContain("setHasMoreResults(Boolean(body.hasMore && body.nextCursor))");
    expect(clientCode).not.toContain("setActiveView(\"grid\");");
  });

  it("keeps visible app copy conversational instead of technical", () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");
    const copyCode = readFileSync("src/content/ui-copy.ts", "utf8");
    const guide = readFileSync("VOICE_AND_TONE.md", "utf8");
    const blockedVisiblePhrases = [
      "Search the open web",
      "No purchasable individual guitar listings",
      "Web result",
      "Open web",
      "Product page",
      "Get matched quickly",
      "Recommendations",
      "Edit quiz answers",
      "Tracked search",
      "unified listing feed",
      "incomplete cost estimates",
      "possibly stale results",
      "Individual listing only",
      "Prototype only"
    ];

    expect(guide).toContain("knowledgeable guitar-shop friend");
    expect(copyCode).toContain("Find the guitar you’ve been looking for.");
    expect(copyCode).toContain("Something went wrong while searching. Try again.");
    for (const phrase of blockedVisiblePhrases) {
      expect(clientCode).not.toContain(phrase);
    }
  });
});
