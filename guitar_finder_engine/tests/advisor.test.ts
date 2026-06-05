import { describe, expect, it } from "vitest";
import { recommendGuitars } from "../src/advisor.js";

describe("Advisor constrained ranking", () => {
  it("recommends Misha signature guitars first for Misha + Djent + $3k-$5k", () => {
    const results = recommendGuitars({
      budgetMin: 3000,
      budgetMax: 5000,
      genres: ["djent"],
      artists: ["Misha Mansoor"],
      tunings: [],
      conditionPreference: "new-only"
    });

    expect(results.length).toBeGreaterThan(1);
    expect(results[0].guitar.id).toBe("jackson-misha-ht6");
    expect(results[1].guitar.id).toBe("jackson-misha-ht7");
    expect(results.some(result => result.guitar.id === "ibanez-jbbm40")).toBe(false);
    expect(results.every(result => (result.guitar.typicalNewPrice ?? 0) >= 3000 && (result.guitar.typicalNewPrice ?? Infinity) <= 5000)).toBe(true);
  });

  it("only recommends JBBM40 when JB Brubaker / August Burns Red context and budget fit", () => {
    const results = recommendGuitars({
      budgetMin: 900,
      budgetMax: 1500,
      genres: ["metalcore"],
      artists: ["August Burns Red"],
      tunings: ["drop c"],
      conditionPreference: "new-only"
    });

    expect(results[0].guitar.id).toBe("ibanez-jbbm40");
  });

  it("excludes out-of-budget products", () => {
    const results = recommendGuitars({
      budgetMin: 3000,
      budgetMax: 5000,
      genres: ["djent"],
      artists: ["Misha Mansoor"],
      tunings: [],
      conditionPreference: "new-only"
    });

    expect(results.some(result => result.guitar.typicalNewPrice === 1199)).toBe(false);
  });

  it("honors required string count as a hard constraint", () => {
    const results = recommendGuitars({
      budgetMin: 3000,
      budgetMax: 5000,
      genres: ["djent"],
      artists: ["Misha Mansoor"],
      tunings: ["drop a"],
      strings: 7,
      conditionPreference: "new-only"
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every(result => result.guitar.strings === 7)).toBe(true);
  });
});
