import { guitars, listings } from "./catalog";
import { includesNormalized, sameNormalized } from "./normalize";
import type { FinderSearch, GuitarModel, Listing } from "./types";

function matchesExactModel(guitar: GuitarModel, search: FinderSearch): boolean {
  if (search.brand && !sameNormalized(guitar.brand, search.brand)) return false;
  if (search.family && !sameNormalized(guitar.family, search.family)) return false;
  if (search.model && !sameNormalized(guitar.model, search.model)) return false;
  if (search.variant && !sameNormalized(guitar.variant, search.variant)) return false;
  if (search.finish && !sameNormalized(guitar.finish, search.finish)) return false;
  if (search.year && guitar.yearStart && guitar.yearEnd) {
    if (search.year < guitar.yearStart || search.year > guitar.yearEnd) return false;
  }
  return true;
}

export function findExactModels(search: FinderSearch): GuitarModel[] {
  return guitars.filter(guitar => matchesExactModel(guitar, search));
}

export function findExactListings(search: FinderSearch): Array<{ guitar: GuitarModel; listing: Listing }> {
  const models = findExactModels(search);
  const ids = new Set(models.map(model => model.id));

  return listings
    .filter(listing => ids.has(listing.guitarModelId))
    .map(listing => ({
      listing,
      guitar: models.find(model => model.id === listing.guitarModelId)!
    }));
}

export function parseFinderQuery(query: string): FinderSearch {
  const q = query.toLowerCase();

  if (q.includes("prs") && q.includes("holcomb") && q.includes("core")) {
    return {
      brand: "PRS",
      family: "Core",
      model: "Mark Holcomb Core",
      finish: q.includes("cobalt smokeburst") ? "Cobalt Smokeburst" : undefined
    };
  }

  if (q.includes("fender") && q.includes("custom shop") && (q.includes("1963") || q.includes("63")) && q.includes("strat")) {
    return {
      brand: "Fender",
      family: "Custom Shop",
      model: "1963 Stratocaster",
      finish: q.includes("sonic blue") ? "Sonic Blue" : undefined
    };
  }

  throw new Error("Query parser needs a structured extraction fallback for this query.");
}
