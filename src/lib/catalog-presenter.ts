import { guitars, listings } from "@/engine/catalog";
import { toListingResult } from "./finder-results";
import type { FinderListingResult } from "./finder-results";

export function allListingResults(): FinderListingResult[] {
  return listings.flatMap(listing => {
    const guitar = guitars.find(model => model.id === listing.guitarModelId);
    return guitar ? [toListingResult(guitar, listing)] : [];
  });
}

export function listingDetail(id: string) {
  const all = allListingResults();
  const index = all.findIndex(listing => listing.id === id);

  if (index === -1) return null;

  return {
    listing: all[index],
    all,
    index,
    previous: all[index - 1] ?? null,
    next: all[index + 1] ?? null
  };
}
