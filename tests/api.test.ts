import { describe, expect, it } from "vitest";
import { POST as advisorPost } from "../src/app/api/advisor/recommend/route";
import { POST as finderPost } from "../src/app/api/finder/search/route";
import { GET as healthGet } from "../src/app/api/health/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost.test", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("API route integration", () => {
  it("reports health", async () => {
    const response = await healthGet();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
  });

  it("returns exact PRS Core listings without SE substitutions", async () => {
    const response = await finderPost(jsonRequest({ query: "PRS Holcomb Core Cobalt Smokeburst" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.interpretedProduct.modelId).toBe("prs-holcomb-core-cobalt");
    expect(body.listings).toHaveLength(1);
    expect(body.listings[0].guitarModelId).toBe("prs-holcomb-core-cobalt");
    expect(body.listings.some((listing: { guitarModelId: string }) => listing.guitarModelId === "prs-se-holcomb")).toBe(false);
    expect(body.listings[0].totalEstimatedCost).toBe(5307);
  });

  it("returns exact Fender Custom Shop listings without Vintera substitutions", async () => {
    const response = await finderPost(jsonRequest({ query: "Fender Custom Shop 1963 Stratocaster Sonic Blue" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.interpretedProduct.modelId).toBe("fender-custom-shop-1963-strat-sonic-blue");
    expect(body.listings).toHaveLength(1);
    expect(body.listings[0].guitarModelId).toBe("fender-custom-shop-1963-strat-sonic-blue");
    expect(
      body.listings.some((listing: { guitarModelId: string }) => listing.guitarModelId === "fender-vintera-ii-60s-strat-sonic-blue")
    ).toBe(false);
  });

  it("prefers zero results when a query cannot be safely interpreted", async () => {
    const response = await finderPost(jsonRequest({ query: "cheap guitar like a Holcomb" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.interpretedProduct).toBeNull();
    expect(body.listings).toHaveLength(0);
  });

  it("returns constrained Misha seven-string advisor recommendations", async () => {
    const response = await advisorPost(jsonRequest({
      budgetMin: 3000,
      budgetMax: 5000,
      genres: ["djent"],
      artists: ["Misha Mansoor"],
      tunings: ["Drop A"],
      strings: 7,
      conditionPreference: "new-only"
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.bestMatch.id).toBe("jackson-misha-ht7");
    expect(body.all.every((card: { strings: number; priceEstimate: number }) => card.strings === 7 && card.priceEstimate <= 5000)).toBe(true);
    expect(body.all.some((card: { id: string }) => card.id === "ibanez-jbbm40")).toBe(false);
  });
});
