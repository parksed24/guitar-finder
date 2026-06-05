import type { GuitarModel } from "@/engine/types";

export function modelDisplayName(guitar: GuitarModel) {
  return [guitar.brand, guitar.family, guitar.model, guitar.variant, guitar.finish].filter(Boolean).join(" ");
}

export function exactFinderQuery(guitar: GuitarModel) {
  return [guitar.brand, guitar.family, guitar.model, guitar.finish].filter(Boolean).join(" ");
}

export function retailerName(sourceUrl: string, seller: string) {
  if (sourceUrl.startsWith("retailer://")) return seller;
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return seller;
  }
}
