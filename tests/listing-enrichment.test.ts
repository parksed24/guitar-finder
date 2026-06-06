import { beforeEach, describe, expect, it } from "vitest";
import {
  clearListingEnrichmentCache,
  enrichListingMetadata,
  extractJsonLdListingMetadata,
  extractPriceFromText,
  isReverbItemPage,
  ReverbMetadataAdapter
} from "../src/lib/listing-enrichment";

const productJsonLd = JSON.stringify({
  "@type": "Product",
  name: "PRS Mark Holcomb Core",
  image: ["https://images.reverb.com/prs-core.jpg"],
  offers: {
    "@type": "Offer",
    price: "4250.00",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock"
  }
});

describe("listing metadata enrichment", () => {
  beforeEach(() => clearListingEnrichmentCache());

  it("extracts JSON-LD Offer.price, currency, availability, and Product.image", () => {
    const result = extractJsonLdListingMetadata(`<script type="application/ld+json">${productJsonLd}</script>`, "https://reverb.com/item/123-prs-core");

    expect(result.itemPrice).toBe(4250);
    expect(result.currency).toBe("USD");
    expect(result.priceLabel).toBe("$4,250");
    expect(result.availability).toBe("InStock");
    expect(result.primaryImage?.url).toBe("https://images.reverb.com/prs-core.jpg");
    expect(result.extractionMethod).toBe("json-ld-offer");
  });

  it("handles AggregateOffer.lowPrice safely", () => {
    const result = extractJsonLdListingMetadata(`<script type="application/ld+json">${JSON.stringify({
      "@type": "Product",
      name: "Fender Custom Shop Jazzmaster",
      image: "https://images.reverb.com/jazzmaster.webp",
      offers: { "@type": "AggregateOffer", lowPrice: "3999", highPrice: "4800", priceCurrency: "USD" }
    })}</script>`, "https://reverb.com/item/456-jazzmaster");

    expect(result.itemPrice).toBe(3999);
    expect(result.primaryImage?.source).toBe("json-ld");
  });

  it("rejects Reverb search and Price Guide pages as active listings", () => {
    expect(isReverbItemPage("https://reverb.com/item/123-prs-core")).toBe(true);
    expect(isReverbItemPage("https://reverb.com/marketplace?query=prs")).toBe(false);
    expect(isReverbItemPage("https://reverb.com/price-guide/guide/123-prs")).toBe(false);
  });

  it("enriches a permitted Reverb item page", async () => {
    const adapter = new ReverbMetadataAdapter();
    const fetcher = async () => new Response(`<html><head><script type="application/ld+json">${productJsonLd}</script></head></html>`, {
      status: 200,
      headers: { "content-type": "text/html" }
    });

    const result = await adapter.enrich("https://reverb.com/item/123-prs-core", { fetcher, now: 10 });

    expect(result.itemPrice).toBe(4250);
    expect(result.primaryImage?.url).toContain("prs-core.jpg");
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("does not extract forum discussion ranges, historical sold prices, shipping, or financing as item prices", () => {
    expect(extractPriceFromText("$2,000-$3,000 is easily possible in a discussion", "search-rich-result").value).toBeUndefined();
    expect(extractPriceFromText("This guitar sold for $1,800 last year", "search-rich-result").value).toBeUndefined();
    expect(extractPriceFromText("Shipping is $125", "search-rich-result").value).toBeUndefined();
    expect(extractPriceFromText("$79 per month financing available", "search-rich-result").value).toBeUndefined();
    expect(extractPriceFromText("MSRP: $4,999", "search-rich-result").value).toBeUndefined();
  });

  it("uses generic page metadata for approved retailer sources", async () => {
    let fetches = 0;
    const result = await enrichListingMetadata({
      url: "https://www.sweetwater.com/store/detail/prs-core",
      title: "PRS Mark Holcomb Core"
    }, {
      now: 20,
      fetcher: async () => {
        fetches += 1;
        return new Response(`
          <html><head>
            <meta property="og:title" content="PRS Mark Holcomb Core">
            <meta property="product:price:amount" content="4250.00">
            <meta property="product:price:currency" content="USD">
            <meta name="twitter:image" content="https://media.sweetwater.com/prs-core?signature=keep">
          </head></html>
        `, { headers: { "content-type": "text/html" } });
      }
    });

    expect(fetches).toBe(1);
    expect(result.itemPrice).toBe(4250);
    expect(result.priceLabel).toBe("$4,250");
    expect(result.primaryImage?.source).toBe("twitter-card");
    expect(result.primaryImage?.url).toContain("signature=keep");
  });

  it("extracts microdata prices from approved product pages", async () => {
    const result = await enrichListingMetadata({
      url: "https://wildwoodguitars.com/product/prs-core",
      title: "PRS Mark Holcomb Core"
    }, {
      now: 30,
      fetcher: async () => new Response(`
        <div itemscope itemtype="https://schema.org/Product">
          <span itemprop="priceCurrency" content="USD"></span>
          <span itemprop="price" content="4399.00"></span>
        </div>
      `, { headers: { "content-type": "text/html" } })
    });

    expect(result.itemPrice).toBe(4399);
    expect(result.extractionMethod).toBe("microdata");
  });

  it("uses embedded product JSON images and prices from approved store pages", async () => {
    const result = await enrichListingMetadata({
      url: "https://ish.guitars/products/prs-core",
      title: "PRS Mark Holcomb Core"
    }, {
      now: 40,
      fetcher: async () => new Response(`
        <script>
          window.__PRODUCT__ = {
            "price": "425000",
            "currency": "USD",
            "images": ["https://cdn.shopify.com/s/files/1/prs-core.jpg?v=123"]
          };
        </script>
      `, { headers: { "content-type": "text/html" } })
    });

    expect(result.itemPrice).toBe(4250);
    expect(result.primaryImage?.source).toBe("embedded-product-json");
  });

  it("does not fetch unknown domains without approval and still keeps search thumbnail fallback", async () => {
    let fetches = 0;
    const result = await enrichListingMetadata({
      url: "https://shop.example.com/products/prs-core",
      title: "PRS Holcomb Core for sale",
      snippet: "PRS Holcomb Core for sale $4,250",
      thumbnailUrl: "https://cdn.shopify.com/prs-core.jpg"
    }, {
      fetcher: async () => {
        fetches += 1;
        return new Response("");
      }
    });

    expect(fetches).toBe(0);
    expect(result.itemPrice).toBe(4250);
    expect(result.primaryImage?.source).toBe("search-thumbnail");
    expect(result.rejectionReasons).toContain("metadata-fetch-not-permitted");
  });

  it("refresh search bypasses stale enrichment cache", async () => {
    let price = 4200;
    const fetcher = async () => new Response(`<script type="application/ld+json">${JSON.stringify({
      "@type": "Product",
      name: "PRS Mark Holcomb Core",
      offers: { "@type": "Offer", price, priceCurrency: "USD" }
    })}</script>`, { headers: { "content-type": "text/html" } });

    const first = await enrichListingMetadata({ url: "https://reverb.com/item/123-prs-core", title: "PRS Core" }, { fetcher, now: 1 });
    price = 4600;
    const cached = await enrichListingMetadata({ url: "https://reverb.com/item/123-prs-core", title: "PRS Core" }, { fetcher, now: 2 });
    const refreshed = await enrichListingMetadata({ url: "https://reverb.com/item/123-prs-core", title: "PRS Core" }, { fetcher, now: 3, forceRefresh: true });

    expect(first.itemPrice).toBe(4200);
    expect(cached.itemPrice).toBe(4200);
    expect(refreshed.itemPrice).toBe(4600);
  });
});
