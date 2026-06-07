import { beforeEach, describe, expect, it } from "vitest";
import {
  assessListingAvailability,
  clearSourceDiscoveryCandidates,
  getSourceDiscoveryCandidates,
  isSearchOrLandingUrl,
  recordSourceDiscoveryCandidate,
  sourceForUrl,
  sourceTypeForListingUrl,
  targetedSearchScopes
} from "../src/lib/source-registry";
import { classifyWebResult, generateGuitarSearchQueries, parseGuitarSearch } from "../src/lib/web-search";

describe("source registry coverage", () => {
  beforeEach(() => {
    clearSourceDiscoveryCandidates();
  });

  it("generates targeted searches for major used and marketplace sources", () => {
    const scopes = targetedSearchScopes();
    const parsed = parseGuitarSearch("PRS Holcomb Core Cobalt Smokeburst");
    const queries = generateGuitarSearchQueries(parsed);

    expect(scopes).toContain("ebay.com");
    expect(scopes).toContain("sweetwater.com/used");
    expect(scopes).toContain("guitarcenter.com/Used");
    expect(queries.some(query => query.includes("site:ebay.com"))).toBe(true);
    expect(queries.some(query => query.includes("site:sweetwater.com/used"))).toBe(true);
    expect(queries.some(query => query.includes("site:guitarcenter.com/Used"))).toBe(true);
    expect(queries.some(query => query.includes("guitar shop"))).toBe(true);
    expect(queries.some(query => query.includes("Europe"))).toBe(true);
  });

  it("treats Sweetwater Gear Exchange item pages distinctly and rejects category pages", () => {
    const itemUrl = "https://www.sweetwater.com/used/listings/12345-prs-holcomb-core-cobalt-smokeburst";
    expect(sourceForUrl(itemUrl)?.displayName).toBe("Sweetwater Gear Exchange");
    expect(sourceTypeForListingUrl(itemUrl)).toBe("marketplace");
    expect(isSearchOrLandingUrl("https://www.sweetwater.com/used/search?query=prs", "search results")).toBe(true);
  });

  it("treats Guitar Center Used item pages distinctly and rejects the landing page", () => {
    const itemUrl = "https://www.guitarcenter.com/Used/PRS/Mark-Holcomb-Core-Electric-Guitar.gc";
    expect(sourceForUrl(itemUrl)?.displayName).toBe("Guitar Center Used");
    expect(sourceTypeForListingUrl(itemUrl)).toBe("retailer");
    expect(isSearchOrLandingUrl("https://www.guitarcenter.com/Used", "Used gear landing page")).toBe(true);
  });

  it("accepts active Reverb item pages and rejects sold or guide pages", () => {
    const parsed = parseGuitarSearch("Fender Custom Shop Jazzmaster Fiesta Red");
    expect(classifyWebResult(parsed, {
      title: "Fender Custom Shop Jazzmaster Fiesta Red",
      url: "https://reverb.com/item/999-fender-custom-shop-jazzmaster-fiesta-red",
      description: "Used Fender Custom Shop Jazzmaster Fiesta Red for sale $4,299"
    })).not.toBeNull();
    expect(classifyWebResult(parsed, {
      title: "Sold Fender Custom Shop Jazzmaster Fiesta Red",
      url: "https://reverb.com/item/998-fender-custom-shop-jazzmaster-fiesta-red",
      description: "This item is sold"
    })).toBeNull();
    expect(isSearchOrLandingUrl("https://reverb.com/price-guide/fender-jazzmaster", "price guide")).toBe(true);
  });

  it("keeps unknown retailer product pages eligible and enters discovery queue", () => {
    const parsed = parseGuitarSearch("Fender Custom Shop Jazzmaster Fiesta Red");
    const result = classifyWebResult(parsed, {
      title: "Fender Custom Shop Jazzmaster Fiesta Red",
      url: "https://rare-guitar-shop.example/products/fender-custom-shop-jazzmaster-fiesta-red",
      description: "In stock Fender Custom Shop Jazzmaster Fiesta Red $4,399"
    });

    expect(result).not.toBeNull();
    recordSourceDiscoveryCandidate(result?.url ?? "");
    expect(getSourceDiscoveryCandidates()[0]).toMatchObject({
      domain: "rare-guitar-shop.example",
      reviewStatus: "new"
    });
  });

  it("classifies unavailable listings before ranking", () => {
    expect(assessListingAvailability("listing has ended", "https://www.ebay.com/itm/1")).toMatchObject({
      isAvailable: false,
      status: "ended"
    });
    expect(assessListingAvailability("available now for sale", "https://shop.example/products/guitar")).toMatchObject({
      isAvailable: true,
      status: "active"
    });
  });
});
