import { describe, expect, it } from "vitest";
import { EbayBrowseAdapter, sourceListingToWebResult, type CanonicalGuitarSearch } from "../src/lib/source-adapters";

const request: CanonicalGuitarSearch = {
  originalQuery: "PRS Holcomb Core Cobalt Smokeburst",
  brand: "PRS",
  family: "Core",
  model: "Mark Holcomb Core",
  finish: "Cobalt Smokeburst",
  requiredTerms: ["PRS", "Holcomb", "Core"],
  exclusionTerms: ["SE"]
};

describe("source adapters", () => {
  it("reports eBay Browse as not configured without server credentials", async () => {
    const adapter = new EbayBrowseAdapter({ env: {} });
    await expect(adapter.healthCheck()).resolves.toMatchObject({
      sourceId: "ebay",
      configured: false,
      healthy: false
    });
  });

  it("maps eligible eBay Browse items into source listings", async () => {
    const fetcher = async (input: string) => {
      const url = new URL(input);
      if (url.pathname.includes("/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "token", expires_in: 7200 }), { status: 200 });
      }
      return new Response(JSON.stringify({
        itemSummaries: [
          {
            itemId: "v1|123|0",
            title: "PRS Mark Holcomb Core Cobalt Smokeburst",
            itemWebUrl: "https://www.ebay.com/itm/123",
            image: { imageUrl: "https://i.ebayimg.com/images/g/prs/s-l1600.jpg" },
            price: { value: "4999.00", currency: "USD" },
            seller: { username: "greatguitarshop" },
            itemLocation: { city: "Austin", stateOrProvince: "TX", country: "US" },
            condition: "Used",
            estimatedAvailabilities: [{ estimatedAvailabilityStatus: "IN_STOCK", estimatedAvailableQuantity: 1 }],
            itemEndDate: "2099-01-01T00:00:00.000Z"
          }
        ]
      }), { status: 200 });
    };
    const adapter = new EbayBrowseAdapter({
      env: {
        EBAY_CLIENT_ID: "client",
        EBAY_CLIENT_SECRET: "secret",
        EBAY_MARKETPLACE_ID: "EBAY_US",
        EBAY_ENVIRONMENT: "sandbox"
      },
      fetcher,
      now: Date.parse("2026-06-06T00:00:00.000Z")
    });

    const response = await adapter.search(request);
    expect(response.listings).toHaveLength(1);
    expect(response.listings[0]).toMatchObject({
      title: "PRS Mark Holcomb Core Cobalt Smokeburst",
      itemPrice: 4999,
      currency: "USD",
      sourceName: "eBay",
      condition: "Used"
    });
    const webResult = sourceListingToWebResult(response.listings[0], Date.parse("2026-06-06T00:00:00.000Z"));
    expect(webResult).toMatchObject({
      sourceType: "marketplace",
      itemPrice: 4999,
      thumbnailUrl: "https://i.ebayimg.com/images/g/prs/s-l1600.jpg"
    });
  });

  it("excludes ended eBay Browse items", async () => {
    const fetcher = async (input: string) => {
      const url = new URL(input);
      if (url.pathname.includes("/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "token", expires_in: 7200 }), { status: 200 });
      }
      return new Response(JSON.stringify({
        itemSummaries: [
          {
            itemId: "v1|ended|0",
            title: "PRS Mark Holcomb Core Cobalt Smokeburst",
            itemWebUrl: "https://www.ebay.com/itm/ended",
            price: { value: "4999.00", currency: "USD" },
            itemEndDate: "2020-01-01T00:00:00.000Z"
          }
        ]
      }), { status: 200 });
    };
    const adapter = new EbayBrowseAdapter({
      env: { EBAY_CLIENT_ID: "client", EBAY_CLIENT_SECRET: "secret", EBAY_ENVIRONMENT: "sandbox" },
      fetcher,
      now: Date.parse("2026-06-06T00:00:00.000Z")
    });

    const response = await adapter.search(request);
    expect(response.listings).toHaveLength(0);
  });

  it("excludes unavailable eBay Browse items", async () => {
    const fetcher = async (input: string) => {
      const url = new URL(input);
      if (url.pathname.includes("/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "token", expires_in: 7200 }), { status: 200 });
      }
      return new Response(JSON.stringify({
        itemSummaries: [
          {
            itemId: "v1|sold|0",
            title: "PRS Mark Holcomb Core Cobalt Smokeburst sold",
            itemWebUrl: "https://www.ebay.com/itm/sold",
            price: { value: "4999.00", currency: "USD" },
            estimatedAvailabilities: [{ estimatedAvailabilityStatus: "OUT_OF_STOCK", estimatedAvailableQuantity: 0 }]
          }
        ]
      }), { status: 200 });
    };
    const adapter = new EbayBrowseAdapter({
      env: { EBAY_CLIENT_ID: "client", EBAY_CLIENT_SECRET: "secret", EBAY_ENVIRONMENT: "sandbox" },
      fetcher,
      now: Date.parse("2026-06-06T00:00:00.000Z")
    });

    const response = await adapter.search(request);
    expect(response.listings).toHaveLength(0);
  });
});
