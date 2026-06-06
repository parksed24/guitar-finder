import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("customer-facing cleanup", () => {
  const clientCode = () => readFileSync("src/app/finder-experience.tsx", "utf8");

  it("keeps search diagnostics behind the development debug flag", () => {
    const code = clientCode();

    expect(code).toContain("process.env.NODE_ENV !== \"production\"");
    expect(code).toContain("new URLSearchParams(window.location.search).get(\"debug\") === \"1\"");
    expect(code).toContain("debugEnabled && searchDiagnostics && <SearchDebug diagnostics={searchDiagnostics} />");
  });

  it("does not show match-confidence clutter in cards or web listing details", () => {
    const code = clientCode();
    const gridCard = code.slice(code.indexOf("function ListingCard"), code.indexOf("function ListingListCard"));
    const listCard = code.slice(code.indexOf("function ListingListCard"), code.indexOf("function SourcePlaceholder"));
    const webDetails = code.slice(code.indexOf("function InfoSections"), code.indexOf("function AdvisorView"));

    expect(gridCard).not.toContain("listing.confidence");
    expect(gridCard).not.toContain("possibleMatch");
    expect(listCard).not.toContain("listing.confidence");
    expect(listCard).not.toContain("possibleMatch");
    expect(webDetails).not.toContain("<small>Domain</small>");
    expect(webDetails).not.toContain("<small>Match</small>");
  });

  it("uses shopper-facing fallback copy for missing prices", () => {
    const code = clientCode();
    const copy = readFileSync("src/content/ui-copy.ts", "utf8");

    expect(copy).toContain("Price available on listing");
    expect(code).not.toContain("Price available on source");
  });

  it("does not invent zero-cost totals for web results in matching listings", () => {
    const code = clientCode();
    const productView = code.slice(code.indexOf("function ProductView"), code.indexOf("function ListingDetail"));

    expect(productView).toContain("item.resultType === \"web\"");
    expect(productView).toContain("itemPriceText || uiCopy.listing.priceOnSource");
    expect(productView).not.toContain("money(item.total)} <small>est. total");
  });
});
