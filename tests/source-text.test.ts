import { describe, expect, it } from "vitest";
import { sanitizeSourceText } from "../src/lib/source-text";

describe("source text cleanup", () => {
  it("strips HTML, decodes entities, and collapses whitespace", () => {
    expect(sanitizeSourceText("<strong>PRS Mark Holcomb Core</strong>&nbsp;in Cobalt &amp; Smokeburst.")).toBe("PRS Mark Holcomb Core in Cobalt & Smokeburst.");
  });

  it("hides short or generic boilerplate instead of showing noisy source copy", () => {
    expect(sanitizeSourceText("Shop now")).toBeUndefined();
    expect(sanitizeSourceText("<script>alert(1)</script> Cart")).toBeUndefined();
  });
});
