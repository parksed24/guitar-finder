import { findExactListings, parseFinderQuery } from "@/engine/finder";
import type { FinderSearch, GuitarModel, Listing } from "@/engine/types";
import { exactFinderQuery, modelDisplayName, retailerName } from "./model-copy";
import { totalCost } from "./money";

export interface FinderListingResult {
  id: string;
  guitarModelId: string;
  title: string;
  sourceName: string;
  seller: string;
  sellerType: Listing["sellerType"];
  condition: Listing["condition"];
  itemPrice: number;
  shipping: number;
  estimatedSalesTax: number;
  estimatedImportDuty: number;
  totalEstimatedCost: number;
  currency: Listing["currency"];
  country: string;
  sourceUrl: string;
  checkedTimestamp: string;
  imageUrl: string;
}

export interface FinderResponse {
  query: string;
  interpretedProduct: (FinderSearch & {
    canonicalQuery: string;
    modelId?: string;
    displayName?: string;
  }) | null;
  listings: FinderListingResult[];
  count: number;
  checkedTimestamp: string;
}

export function imageForModel(guitar: GuitarModel) {
  return `/api/guitar-art/${guitar.id}`;
}

export function toListingResult(guitar: GuitarModel, listing: Listing): FinderListingResult {
  return {
    id: listing.id,
    guitarModelId: guitar.id,
    title: modelDisplayName(guitar),
    sourceName: retailerName(listing.sourceUrl, listing.seller),
    seller: listing.seller,
    sellerType: listing.sellerType,
    condition: listing.condition,
    itemPrice: listing.itemPrice,
    shipping: listing.shipping,
    estimatedSalesTax: listing.estimatedTax,
    estimatedImportDuty: listing.estimatedImport,
    totalEstimatedCost: totalCost({
      itemPrice: listing.itemPrice,
      shipping: listing.shipping,
      estimatedTax: listing.estimatedTax,
      estimatedImport: listing.estimatedImport
    }),
    currency: listing.currency,
    country: listing.country,
    sourceUrl: listing.sourceUrl,
    checkedTimestamp: listing.checkedAt,
    imageUrl: imageForModel(guitar)
  };
}

export function buildFinderResponse(query: string): FinderResponse {
  let interpreted: FinderSearch;

  try {
    interpreted = parseFinderQuery(query);
  } catch {
    return {
      query,
      interpretedProduct: null,
      listings: [],
      count: 0,
      checkedTimestamp: new Date().toISOString()
    };
  }

  const exactMatches = findExactListings(interpreted);
  const firstModel = exactMatches[0]?.guitar;
  const listings = exactMatches.map(({ guitar, listing }) => toListingResult(guitar, listing));

  return {
    query,
    interpretedProduct: {
      ...interpreted,
      canonicalQuery: firstModel ? exactFinderQuery(firstModel) : Object.values(interpreted).filter(Boolean).join(" "),
      modelId: firstModel?.id,
      displayName: firstModel ? modelDisplayName(firstModel) : undefined
    },
    listings,
    count: listings.length,
    checkedTimestamp: new Date().toISOString()
  };
}
