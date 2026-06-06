import { describe, expect, it } from "vitest";
import { buildSeedRows, validateSeedCatalog } from "../scripts/seed-supabase";

describe("Supabase seed validation", () => {
  it("validates the initial catalog", () => {
    expect(validateSeedCatalog()).toEqual({ ok: true, errors: [] });
  });

  it("stores Ibanez JBBM40 as the JB Brubaker signature model", () => {
    const rows = buildSeedRows();
    const jbbm40 = rows.guitarModels.find(row => row.id === "ibanez-jbbm40");
    const artist = rows.artists.find(row => row.name === "JB Brubaker");
    const relationship = rows.artistRelationships.find(row =>
      row.guitar_model_id === "ibanez-jbbm40" &&
      row.artist_id === artist?.id &&
      row.relationship_type === "signature-model"
    );

    expect(jbbm40?.model).toBe("JBBM40 JB Brubaker Signature");
    expect(relationship).toBeDefined();
  });

  it("keeps listing references valid and approved for public search", () => {
    const rows = buildSeedRows();
    const guitarIds = new Set(rows.guitarModels.map(row => row.id));

    expect(rows.listings.length).toBeGreaterThan(0);
    expect(rows.listings.every(row => guitarIds.has(row.guitar_model_id))).toBe(true);
    expect(rows.guitarModels.every(row => row.approved)).toBe(true);
    expect(rows.listings.every(row => row.approved)).toBe(true);
  });
});
