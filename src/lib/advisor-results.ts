import { recommendGuitars } from "@/engine/advisor";
import type { AdvisorPreferences, GuitarModel, Recommendation } from "@/engine/types";
import { exactFinderQuery, modelDisplayName } from "./model-copy";
import { imageForModel } from "./finder-results";

export interface AdvisorCard {
  id: string;
  title: string;
  label: Recommendation["label"];
  confidence: number;
  reasons: string[];
  tradeoffs: string[];
  exactFinderSearchQuery: string;
  priceEstimate?: number;
  strings: number;
  tuningSuitability: string[];
  pickupType: GuitarModel["pickupType"];
  bridgeType: string;
  imageUrl: string;
}

export interface AdvisorResponse {
  bestMatch: AdvisorCard | null;
  artistAuthenticAlternatives: AdvisorCard[];
  highFitAlternatives: AdvisorCard[];
  bestValue: AdvisorCard | null;
  all: AdvisorCard[];
}

function priceForOutput(guitar: GuitarModel, prefs: AdvisorPreferences) {
  if (prefs.conditionPreference === "new-only") return guitar.typicalNewPrice;
  return guitar.typicalUsedLow ?? guitar.typicalNewPrice;
}

function toAdvisorCard(recommendation: Recommendation, prefs: AdvisorPreferences): AdvisorCard {
  return {
    id: recommendation.guitar.id,
    title: modelDisplayName(recommendation.guitar),
    label: recommendation.label,
    confidence: recommendation.confidence,
    reasons: recommendation.reasons,
    tradeoffs: recommendation.tradeoffs,
    exactFinderSearchQuery: exactFinderQuery(recommendation.guitar),
    priceEstimate: priceForOutput(recommendation.guitar, prefs),
    strings: recommendation.guitar.strings,
    tuningSuitability: recommendation.guitar.tuningSuitability,
    pickupType: recommendation.guitar.pickupType,
    bridgeType: recommendation.guitar.bridgeType,
    imageUrl: imageForModel(recommendation.guitar)
  };
}

export function buildAdvisorResponse(prefs: AdvisorPreferences): AdvisorResponse {
  const all = recommendGuitars(prefs, 8).map(result => toAdvisorCard(result, prefs));
  const bestMatch = all.find(result => result.label === "Best Match") ?? null;
  const artistAuthenticAlternatives = all.filter(result => result.label === "Artist-Authentic Alternative");
  const bestValue = all.find(result => result.label === "Best Value") ?? null;
  const highFitAlternatives = all.filter(result =>
    result.label === "High-Fit Alternative" || result.label === "Premium Alternative"
  );

  return {
    bestMatch,
    artistAuthenticAlternatives,
    highFitAlternatives,
    bestValue,
    all
  };
}
