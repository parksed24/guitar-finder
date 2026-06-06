import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  classifyWebResult,
  clearWebSearchCache,
  mergeAndFilterWebResults,
  parseGuitarSearch,
  platformShortcuts,
  QUALIFIED_RESULTS_PER_BATCH,
  searchOpenWebForGuitars
} from "../src/lib/web-search";

describe("unified purchasable guitar feed filtering", () => {
  beforeEach(() => {
    clearWebSearchCache();
  });

  it("excludes Wikipedia results", () => {
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    expect(classifyWebResult(parsed, {
      title: "Fender Jazzmaster - Wikipedia",
      url: "https://en.wikipedia.org/wiki/Fender_Jazzmaster",
      description: "Informational article"
    })).toBeNull();
  });

  it("excludes Fender brand landing pages", () => {
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    expect(classifyWebResult(parsed, {
      title: "Fender Custom Shop Electric Guitars",
      url: "https://www.fender.com/en-US/custom-shop/electric-guitars/",
      description: "Explore Fender Custom Shop guitars"
    })).toBeNull();
  });

  it("excludes manufacturer category pages with no purchase path", () => {
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    expect(classifyWebResult(parsed, {
      title: "Fender Jazzmaster Guitars",
      url: "https://www.fender.com/en-US/electric-guitars/jazzmaster/",
      description: "Learn about the Jazzmaster family"
    })).toBeNull();
  });

  it("excludes PRS SE results for a PRS Core search", () => {
    const parsed = parseGuitarSearch("PRS Mark Holcomb Core Cobalt Smokeburst");
    const results = mergeAndFilterWebResults(parsed, [{
      title: "PRS SE Mark Holcomb Holcomb Burst for sale",
      url: "https://reverb.com/item/123-prs-se-mark-holcomb",
      description: "PRS SE Mark Holcomb electric guitar for sale $999"
    }]);

    expect(results).toHaveLength(0);
  });

  it("excludes Vintera results for a Fender Custom Shop search", () => {
    const parsed = parseGuitarSearch("Fender Custom Shop 1963 Stratocaster Sonic Blue");
    const results = mergeAndFilterWebResults(parsed, [{
      title: "Fender Vintera II 60s Stratocaster Sonic Blue",
      url: "https://reverb.com/item/124-vintera-sonic-blue",
      description: "Vintera Stratocaster for sale $899"
    }]);

    expect(results).toHaveLength(0);
  });

  it("excludes Stratocaster results for a Jazzmaster search", () => {
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    const results = mergeAndFilterWebResults(parsed, [{
      title: "Fender Custom Shop Stratocaster Fiesta Red",
      url: "https://reverb.com/item/125-fender-custom-shop-stratocaster-fiesta-red",
      description: "Fender Custom Shop Stratocaster Fiesta Red for sale $3999"
    }]);

    expect(results).toHaveLength(0);
  });

  it("excludes HT7 results for an HT6 search", () => {
    const parsed = parseGuitarSearch("Jackson Misha Mansoor Juggernaut HT6 Satin Silver");
    const results = mergeAndFilterWebResults(parsed, [{
      title: "Jackson Misha Mansoor Juggernaut HT7 Satin Laguna Burst",
      url: "https://reverb.com/item/126-jackson-misha-ht7",
      description: "7-string signature guitar for sale $3999"
    }]);

    expect(results).toHaveLength(0);
  });

  it("excludes Sonic Blue for a Fiesta Red search", () => {
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    const results = mergeAndFilterWebResults(parsed, [{
      title: "Fender Custom Shop Jazzmaster Sonic Blue",
      url: "https://reverb.com/item/127-fender-custom-shop-jazzmaster-sonic-blue",
      description: "Fender Custom Shop Jazzmaster Sonic Blue for sale $4200"
    }]);

    expect(results).toHaveLength(0);
  });

  it("does not turn platform search-result pages into product cards", () => {
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    expect(classifyWebResult(parsed, {
      title: "Reverb search results for Fender Custom Shop Jazzmaster Fiesta Red",
      url: "https://reverb.com/marketplace?query=Fender%20Custom%20Shop%20Jazzmaster%20Fiesta%20Red",
      description: "Search results"
    })).toBeNull();
  });

  it("accepts marketplace individual item pages as product cards", () => {
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    const result = classifyWebResult(parsed, {
      title: "Fender Custom Shop Jazzmaster Fiesta Red",
      url: "https://reverb.com/item/999-fender-custom-shop-jazzmaster-fiesta-red",
      description: "Used Fender Custom Shop Jazzmaster Fiesta Red for sale $4,299",
      thumbnail: { src: "https://images.reverb.com/listing.jpg" }
    });

    expect(result).toMatchObject({
      sourceType: "marketplace",
      confidence: "Likely exact match",
      isPurchasablePage: true
    });
    expect(result?.buyabilityScore).toBeGreaterThanOrEqual(0.72);
    expect(result?.exactMatchConfidence).toBeGreaterThanOrEqual(0.82);
  });

  it("excludes or strongly demotes sold and archived listings", () => {
    const parsed = parseGuitarSearch("PRS Mark Holcomb Core Cobalt Smokeburst");
    const results = mergeAndFilterWebResults(parsed, [
      {
        title: "Sold PRS Mark Holcomb Core Cobalt Smokeburst",
        url: "https://reverb.com/item/888-prs-core-sold",
        description: "Sold listing archived $4,999"
      },
      {
        title: "PRS Mark Holcomb Core Cobalt Smokeburst for sale",
        url: "https://reverb.com/item/889-prs-core-live",
        description: "Available PRS Mark Holcomb Core Cobalt Smokeburst for sale $4,999"
      }
    ]);

    expect(results[0].url).toContain("889");
    expect(results.every(result => result.freshnessStatus !== "possibly-stale" || result.availabilityWarning)).toBe(true);
  });

  it("uses small secondary fallback text when price is missing", () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    const result = classifyWebResult(parsed, {
      title: "Fender Custom Shop Jazzmaster Fiesta Red",
      url: "https://reverb.com/item/998-fender-custom-shop-jazzmaster-fiesta-red",
      description: "Used Fender Custom Shop Jazzmaster Fiesta Red for sale"
    });

    expect(result?.possiblePrice).toBeUndefined();
    expect(clientCode).toContain("uiCopy.listing.priceOnSource");
    expect(clientCode).toContain("price-muted");
  });

  it("uses source placeholders instead of generic guitar stock imagery when image is missing", () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    const result = classifyWebResult(parsed, {
      title: "Fender Custom Shop Jazzmaster Fiesta Red",
      url: "https://reverb.com/item/997-fender-custom-shop-jazzmaster-fiesta-red",
      description: "Used Fender Custom Shop Jazzmaster Fiesta Red for sale $4,299"
    });

    expect(result?.thumbnailUrl).toBeUndefined();
    expect(result?.imageSource).toBeUndefined();
    expect(clientCode).not.toContain("webResultFallbackImage");
    expect(clientCode).toContain("SourcePlaceholder");
  });

  it("unified feed mixes retailer, marketplace, classified, and boutique cards", () => {
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    const results = mergeAndFilterWebResults(parsed, [
      {
        title: "Fender Custom Shop Jazzmaster Fiesta Red",
        url: "https://reverb.com/item/1-fender-custom-shop-jazzmaster-fiesta-red",
        description: "Used listing $4,299 for sale"
      },
      {
        title: "Fender Custom Shop Jazzmaster Fiesta Red in stock",
        url: "https://wildwoodguitars.com/product/abc/fender-custom-shop-jazzmaster-fiesta-red",
        description: "Boutique shop listing $4,799 in stock"
      },
      {
        title: "Fender Custom Shop Jazzmaster Fiesta Red Craigslist",
        url: "https://newyork.craigslist.org/mnh/msg/d/new-york-fender-custom-shop-jazzmaster/1234567890.html",
        description: "Classified listing Fender Custom Shop Jazzmaster Fiesta Red $3900"
      },
      {
        title: "Fender Custom Shop Jazzmaster Fiesta Red retailer",
        url: "https://shop.example.com/products/fender-custom-shop-jazzmaster-fiesta-red",
        description: "Retailer product page in stock $4,599"
      }
    ]);

    expect(new Set(results.map(result => result.sourceType))).toEqual(new Set(["marketplace", "boutique", "classified", "retailer"]));
  });

  it("renders platform shortcuts only as compact secondary fallback links", () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");
    const copyCode = readFileSync("src/content/ui-copy.ts", "utf8");

    expect(copyCode).toContain("Still looking?");
    expect(clientCode).toContain("platform-link");
    expect(clientCode).not.toContain("Search additional platforms");
  });

  it("ranks cards with price, image, and recent availability above incomplete cards", () => {
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    const results = mergeAndFilterWebResults(parsed, [
      {
        title: "Fender Custom Shop Jazzmaster Fiesta Red",
        url: "https://reverb.com/item/2-fender-custom-shop-jazzmaster-fiesta-red",
        description: "Fender Custom Shop Jazzmaster Fiesta Red for sale",
      },
      {
        title: "Fender Custom Shop Jazzmaster Fiesta Red in stock",
        url: "https://reverb.com/item/3-fender-custom-shop-jazzmaster-fiesta-red",
        description: "Fender Custom Shop Jazzmaster Fiesta Red in stock $4,299",
        thumbnail: { src: "https://images.reverb.com/3.jpg" }
      }
    ]);

    expect(results[0].url).toContain("/3-");
  });

  it("hides missing fields on detail pages rather than inventing them", () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");

    expect(clientCode).toContain('listing.resultType === "web"');
    expect(clientCode).toContain("possiblePrice &&");
    expect(clientCode).not.toContain("Price not shown");
  });

  it("removes duplicate URLs and near-duplicate titles", () => {
    const parsed = parseGuitarSearch("fender jazzmaster custom shop fiesta red");
    const results = mergeAndFilterWebResults(parsed, [
      {
        title: "Fender Custom Shop Jazzmaster Fiesta Red",
        url: "https://shop.example/products/fender-custom-shop-jazzmaster-fiesta-red?utm_source=x",
        description: "Fender Custom Shop Jazzmaster Fiesta Red for sale $4,299"
      },
      {
        title: "Fender Custom Shop Jazzmaster Fiesta Red",
        url: "https://shop.example/products/fender-custom-shop-jazzmaster-fiesta-red?utm_source=y",
        description: "Same listing $4,299"
      }
    ]);

    expect(results).toHaveLength(1);
  });

  it("keeps the Brave key server-side only and cache TTL respected", async () => {
    const clientCode = readFileSync("src/app/finder-experience.tsx", "utf8");
    const envExample = readFileSync(".env.local.example", "utf8");
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return new Response(JSON.stringify({ web: { results: [] } }), { status: 200 });
    };

    expect(clientCode).not.toContain("BRAVE_SEARCH_API_KEY");
    expect(envExample).toContain("BRAVE_SEARCH_API_KEY=");
    expect(envExample).not.toContain("NEXT_PUBLIC_BRAVE");
    await searchOpenWebForGuitars("PRS Mark Holcomb Core Cobalt Smokeburst", { apiKey: "test", ttlSeconds: 1, now: 0, fetcher });
    await searchOpenWebForGuitars("PRS Mark Holcomb Core Cobalt Smokeburst", { apiKey: "test", ttlSeconds: 1, now: 500, fetcher });
    expect(calls).toBeGreaterThan(0);
    const cachedCalls = calls;
    await searchOpenWebForGuitars("PRS Mark Holcomb Core Cobalt Smokeburst", { apiKey: "test", ttlSeconds: 1, now: 1500, fetcher });
    expect(calls).toBeGreaterThan(cachedCalls);
  });

  it("always provides compact fallback platform shortcut data", async () => {
    const response = await searchOpenWebForGuitars("fender jazzmaster custom shop fiesta red", { now: 0 });

    expect(response.shortcuts.map(shortcut => shortcut.name)).toEqual(platformShortcuts(response.query).map(shortcut => shortcut.name));
  });

  it("does not convert missing API key into a zero-results state", async () => {
    const response = await searchOpenWebForGuitars("PRS Holcomb Core Cobalt Smokeburst", { apiKey: "", now: 2 });

    expect(response.searchCompleted).toBe(false);
    expect(response.summary).toBe("Something went wrong while searching. Try again.");
    expect(response.diagnostics?.apiErrors[0].message).toContain("BRAVE_SEARCH_API_KEY");
  });

  it("does not cache empty responses caused by API failures", async () => {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return new Response(JSON.stringify({ error: "rate limit" }), { status: 429 });
    };

    await searchOpenWebForGuitars("PRS Holcomb Core Cobalt Smokeburst", { apiKey: "test", ttlSeconds: 999, now: 3, fetcher });
    await searchOpenWebForGuitars("PRS Holcomb Core Cobalt Smokeburst", { apiKey: "test", ttlSeconds: 999, now: 4, fetcher });

    expect(calls).toBeGreaterThan(1);
  });

  it("refresh search bypasses cached successful responses", async () => {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return new Response(JSON.stringify({ web: { results: [] } }), { status: 200 });
    };

    await searchOpenWebForGuitars("PRS Holcomb Core Cobalt Smokeburst", { apiKey: "test", ttlSeconds: 999, now: 5, fetcher });
    await searchOpenWebForGuitars("PRS Holcomb Core Cobalt Smokeburst", { apiKey: "test", ttlSeconds: 999, now: 6, fetcher });
    const cachedCalls = calls;
    await searchOpenWebForGuitars("PRS Holcomb Core Cobalt Smokeburst", { apiKey: "test", ttlSeconds: 999, now: 7, fetcher, forceRefresh: true });

    expect(calls).toBeGreaterThan(cachedCalls);
  });

  it("resolves PRS Holcomb Core aliases to the same canonical query", () => {
    const aliases = [
      "PRS Holcomb Core",
      "PRS Mark Holcomb Core",
      "PRS Mark Holcomb Signature Core",
      "Mark Holcomb Core PRS"
    ].map(parseGuitarSearch);

    expect(aliases.every(parsed => parsed.brand === "PRS")).toBe(true);
    expect(aliases.every(parsed => parsed.family === "Core")).toBe(true);
    expect(aliases.every(parsed => parsed.model === "Mark Holcomb Core")).toBe(true);
    expect(aliases.every(parsed => parsed.requiredTerms.join("|") === "PRS|Holcomb|Core")).toBe(true);
  });

  it("accepts likely exact PRS Core listings without price or image metadata", () => {
    const parsed = parseGuitarSearch("PRS Holcomb Core Cobalt Smokeburst");
    const result = classifyWebResult(parsed, {
      title: "PRS Holcomb Core Cobalt Smokeburst",
      url: "https://reverb.com/item/777-prs-holcomb-core-cobalt-smokeburst",
      description: "PRS Holcomb Core Cobalt Smokeburst guitar listing"
    });

    expect(result).toMatchObject({
      confidence: "Possible exact match",
      possiblePrice: undefined,
      thumbnailUrl: undefined,
      freshnessStatus: "availability-unverified"
    });
  });

  it("metadata completeness lowers ranking without excluding exact listings", () => {
    const parsed = parseGuitarSearch("PRS Holcomb Core Cobalt Smokeburst");
    const results = mergeAndFilterWebResults(parsed, [
      {
        title: "PRS Holcomb Core Cobalt Smokeburst",
        url: "https://reverb.com/item/778-prs-holcomb-core-cobalt-smokeburst",
        description: "PRS Holcomb Core Cobalt Smokeburst guitar listing"
      },
      {
        title: "PRS Mark Holcomb Core Cobalt Smokeburst",
        url: "https://reverb.com/item/779-prs-holcomb-core-cobalt-smokeburst",
        description: "PRS Holcomb Core Cobalt Smokeburst for sale $4,999 available",
        thumbnail: { src: "https://images.reverb.com/prs.jpg" }
      }
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].url).toContain("779");
  });

  it("excludes PRS SE and generic PRS landing pages while allowing individual Reverb items", () => {
    const parsed = parseGuitarSearch("PRS Holcomb Core Cobalt Smokeburst");

    expect(classifyWebResult(parsed, {
      title: "PRS SE Mark Holcomb Cobalt Smokeburst",
      url: "https://reverb.com/item/780-prs-se-mark-holcomb",
      description: "PRS SE Mark Holcomb for sale $999"
    })).toBeNull();
    expect(classifyWebResult(parsed, {
      title: "PRS Guitars Electric Guitars",
      url: "https://prsguitars.com/electrics",
      description: "Explore PRS electric guitars"
    })).toBeNull();
    expect(classifyWebResult(parsed, {
      title: "PRS Holcomb Core Cobalt Smokeburst",
      url: "https://reverb.com/item/781-prs-holcomb-core-cobalt-smokeburst",
      description: "PRS Holcomb Core Cobalt Smokeburst guitar listing"
    })).not.toBeNull();
  });

  it("includes diagnostics with rejection reason counts", async () => {
    const fetcher = async () => new Response(JSON.stringify({
      web: {
        results: [
          {
            title: "PRS SE Mark Holcomb",
            url: "https://reverb.com/item/782-prs-se-mark-holcomb",
            description: "PRS SE Mark Holcomb for sale $999"
          },
          {
            title: "PRS Holcomb Core Cobalt Smokeburst",
            url: "https://reverb.com/item/783-prs-holcomb-core-cobalt-smokeburst",
            description: "PRS Holcomb Core Cobalt Smokeburst guitar listing"
          }
        ]
      }
    }), { status: 200 });

    const response = await searchOpenWebForGuitars("PRS Holcomb Core Cobalt Smokeburst", { apiKey: "test", now: 8, fetcher });

    expect(response.diagnostics?.rawCandidateCount).toBeGreaterThan(0);
    expect(response.diagnostics?.qualifiedCount).toBe(1);
    expect(response.diagnostics?.rejectionReasons["wrong-family"]).toBeGreaterThanOrEqual(1);
  });

  it("returns no more than twelve qualified listings in the initial paginated batch", async () => {
    const fetcher = async () => new Response(JSON.stringify({
      web: {
        results: Array.from({ length: 20 }, (_, index) => ({
          title: `Fender Custom Shop Jazzmaster Fiesta Red Listing ${index}`,
          url: `https://reverb.com/item/${index}-fender-custom-shop-jazzmaster-fiesta-red`,
          description: `Fender Custom Shop Jazzmaster Fiesta Red for sale $${4200 + index}`
        }))
      }
    }), { status: 200 });

    const response = await searchOpenWebForGuitars("fender jazzmaster custom shop fiesta red", { apiKey: "test", now: 10, fetcher });

    expect(response.webResults).toHaveLength(QUALIFIED_RESULTS_PER_BATCH);
    expect(response.hasMore).toBe(true);
    expect(response.nextCursor).toBeTruthy();
    expect(response.summary).toContain("found so far");
  });

  it("load more appends new qualified results, preserves prior results by cursor, and avoids duplicate URLs", async () => {
    const calls: Array<{ q: string | null; offset: string | null; count: string | null }> = [];
    const fetcher = async (input: string) => {
      const url = new URL(input);
      if (!url.hostname.includes("api.search.brave.com")) {
        return new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } });
      }
      const offset = Number(url.searchParams.get("offset") || 0);
      calls.push({ q: url.searchParams.get("q"), offset: url.searchParams.get("offset"), count: url.searchParams.get("count") });
      const results = offset === 0
        ? Array.from({ length: 12 }, (_, index) => ({
            title: `Fender Custom Shop Jazzmaster Fiesta Red Batch A ${index}`,
            url: `https://reverb.com/item/a-${index}-fender-custom-shop-jazzmaster-fiesta-red`,
            description: `Fender Custom Shop Jazzmaster Fiesta Red for sale $${4300 + index}`
          }))
        : Array.from({ length: 8 }, (_, index) => ({
            title: `Fender Custom Shop Jazzmaster Fiesta Red Batch B ${index}`,
            url: index === 0 ? "https://reverb.com/item/a-0-fender-custom-shop-jazzmaster-fiesta-red" : `https://reverb.com/item/b-${index}-fender-custom-shop-jazzmaster-fiesta-red`,
            description: `Fender Custom Shop Jazzmaster Fiesta Red in stock $${4500 + index}`
          }));
      return new Response(JSON.stringify({ web: { results } }), { status: 200 });
    };

    const first = await searchOpenWebForGuitars("fender jazzmaster custom shop fiesta red", { apiKey: "test", now: 20, fetcher });
    const second = await searchOpenWebForGuitars("fender jazzmaster custom shop fiesta red", { apiKey: "test", now: 21, fetcher, cursor: first.nextCursor });
    const combinedUrls = [...first.webResults, ...second.webResults].map(result => result.url);

    expect(calls.every(call => call.count === "20")).toBe(true);
    expect(calls.some(call => call.offset === "1")).toBe(true);
    expect(second.webResults.length).toBeGreaterThan(0);
    expect(new Set(combinedUrls).size).toBe(combinedUrls.length);
    expect(first.webResults[0].url).toContain("/a-");
  });

  it("pagination does not weaken exact-match, purchasability, or informational-page rejection", async () => {
    const fetcher = async () => new Response(JSON.stringify({
      web: {
        results: [
          {
            title: "Fender Custom Shop Jazzmaster Fiesta Red Wikipedia",
            url: "https://en.wikipedia.org/wiki/Fender_Jazzmaster",
            description: "Fender Custom Shop Jazzmaster Fiesta Red history"
          },
          {
            title: "Fender Custom Shop Jazzmaster Fiesta Red",
            url: "https://www.fender.com/en-US/electric-guitars/jazzmaster/",
            description: "Explore Fender guitars"
          },
          {
            title: "Fender Custom Shop Stratocaster Fiesta Red",
            url: "https://reverb.com/item/wrong-fender-custom-shop-stratocaster-fiesta-red",
            description: "Fender Custom Shop Stratocaster Fiesta Red for sale $3999"
          },
          {
            title: "Fender Custom Shop Jazzmaster Fiesta Red",
            url: "https://reverb.com/item/right-fender-custom-shop-jazzmaster-fiesta-red",
            description: "Fender Custom Shop Jazzmaster Fiesta Red for sale $4499"
          }
        ]
      }
    }), { status: 200 });

    const response = await searchOpenWebForGuitars("fender jazzmaster custom shop fiesta red", { apiKey: "test", now: 30, fetcher });

    expect(response.webResults).toHaveLength(1);
    expect(response.webResults[0].url).toContain("/right-");
    expect(response.rejectedCount).toBeGreaterThanOrEqual(3);
  });

  it("cursor exhausts empty query offsets and does not rerun exhausted offsets", async () => {
    const offsets: string[] = [];
    const fetcher = async (input: string) => {
      const url = new URL(input);
      const query = url.searchParams.get("q") || "";
      const offset = url.searchParams.get("offset") || "0";
      if (!query.includes("for sale")) return new Response(JSON.stringify({ web: { results: [] } }), { status: 200 });
      offsets.push(offset);
      const results = offset === "0"
        ? Array.from({ length: 12 }, (_, index) => ({
            title: `Fender Custom Shop Jazzmaster Fiesta Red Cursor ${index}`,
            url: `https://reverb.com/item/cursor-${index}-fender-custom-shop-jazzmaster-fiesta-red`,
            description: `Fender Custom Shop Jazzmaster Fiesta Red for sale $${4400 + index}`
          }))
        : [];
      return new Response(JSON.stringify({ web: { results } }), { status: 200 });
    };

    const first = await searchOpenWebForGuitars("fender jazzmaster custom shop fiesta red", { apiKey: "test", now: 40, fetcher });
    const second = await searchOpenWebForGuitars("fender jazzmaster custom shop fiesta red", { apiKey: "test", now: 41, fetcher, cursor: first.nextCursor });

    expect(first.hasMore).toBe(true);
    expect(second.hasMore).toBe(false);
    expect(offsets).toContain("0");
    expect(offsets).toContain("1");
    expect(offsets).not.toContain("2");
    expect(second.summary).not.toContain("found so far");
  });
});
