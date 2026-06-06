import { describe, expect, it } from "vitest";
import { findExactListings } from "../src/engine/finder";

describe("Finder exact-match behavior", () => {
  it("excludes PRS SE model from PRS Holcomb Core search", () => {
    const results = findExactListings({
      brand: "PRS",
      family: "Core",
      model: "Mark Holcomb Core",
      finish: "Cobalt Smokeburst"
    });

    expect(results).toHaveLength(1);
    expect(results[0].guitar.id).toBe("prs-holcomb-core-cobalt");
    expect(results.some(result => result.guitar.id === "prs-se-holcomb")).toBe(false);
  });

  it("excludes Vintera from Custom Shop 1963 Stratocaster Sonic Blue search", () => {
    const results = findExactListings({
      brand: "Fender",
      family: "Custom Shop",
      model: "1963 Stratocaster",
      finish: "Sonic Blue"
    });

    expect(results).toHaveLength(1);
    expect(results[0].guitar.id).toBe("fender-custom-shop-1963-strat-sonic-blue");
    expect(results.some(result => result.guitar.id === "fender-vintera-ii-60s-strat-sonic-blue")).toBe(false);
  });
});
