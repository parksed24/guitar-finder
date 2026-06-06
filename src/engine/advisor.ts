import { guitars } from "./catalog";
import { normalizeText } from "./normalize";
import type { AdvisorPreferences, GuitarModel, Recommendation, RecommendationLabel } from "./types";

function priceForPreferences(guitar: GuitarModel, prefs: AdvisorPreferences): number | undefined {
  if (prefs.conditionPreference === "new-only") return guitar.typicalNewPrice;
  return guitar.typicalUsedLow ?? guitar.typicalNewPrice;
}

function withinBudget(guitar: GuitarModel, prefs: AdvisorPreferences): boolean {
  const price = priceForPreferences(guitar, prefs);
  if (price == null) return false;

  if (prefs.allowStretchBudget) {
    const stretchMax = prefs.budgetMax * 1.08;
    return price >= prefs.budgetMin && price <= stretchMax;
  }

  return price >= prefs.budgetMin && price <= prefs.budgetMax;
}

function stringsFit(guitar: GuitarModel, prefs: AdvisorPreferences): boolean {
  return prefs.strings == null || guitar.strings === prefs.strings;
}

function tuningFit(guitar: GuitarModel, prefs: AdvisorPreferences): boolean {
  if (prefs.tunings.length === 0) return true;
  const available = new Set(guitar.tuningSuitability.map(normalizeText));
  return prefs.tunings.every(tuning => available.has(normalizeText(tuning)));
}

function hardwareFit(guitar: GuitarModel, prefs: AdvisorPreferences): boolean {
  if (prefs.pickupType && guitar.pickupType !== prefs.pickupType) return false;
  if (prefs.bridgeType && !normalizeText(guitar.bridgeType).includes(normalizeText(prefs.bridgeType))) return false;
  return true;
}

function artistScore(guitar: GuitarModel, prefs: AdvisorPreferences): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  for (const requestedArtist of prefs.artists) {
    const requested = normalizeText(requestedArtist);

    for (const relationship of guitar.artistRelationships) {
      const artist = normalizeText(relationship.artist);
      if (!(requested.includes(artist) || artist.includes(requested))) continue;

      if (relationship.relationship === "signature-model") {
        score += 60 * relationship.confidence;
        reasons.push(`direct signature relationship: ${relationship.artist}`);
      } else if (relationship.relationship === "documented-user") {
        score += 34 * relationship.confidence;
        reasons.push(`documented artist use: ${relationship.artist}`);
      } else if (relationship.relationship === "documented-era") {
        score += 24 * relationship.confidence;
        reasons.push(`documented artist-era relationship: ${relationship.artist}`);
      } else {
        score += 10 * relationship.confidence;
      }
    }
  }

  return { score, reasons };
}

function genreScore(guitar: GuitarModel, prefs: AdvisorPreferences): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  for (const requestedGenre of prefs.genres) {
    const requested = normalizeText(requestedGenre);

    for (const fit of guitar.genres) {
      const genre = normalizeText(fit.genre);
      if (!(requested.includes(genre) || genre.includes(requested))) continue;
      score += (fit.score / 100) * 26 * fit.confidence;
      reasons.push(...fit.reasons.slice(0, 2));
    }
  }

  return { score, reasons };
}

function availabilityScore(guitar: GuitarModel): number {
  return guitar.productionStatus === "current" ? 5 : 0;
}

function classifyLabel(guitar: GuitarModel, prefs: AdvisorPreferences, rank: number): RecommendationLabel {
  const requestedArtists = prefs.artists.map(normalizeText);
  const signature = guitar.artistRelationships.some(
    relationship =>
      relationship.relationship === "signature-model" &&
      requestedArtists.some(requested => {
        const artist = normalizeText(relationship.artist);
        return requested.includes(artist) || artist.includes(requested);
      })
  );

  if (rank === 0) return "Best Match";
  if (signature) return "Artist-Authentic Alternative";

  const price = priceForPreferences(guitar, prefs) ?? Infinity;
  if (price <= prefs.budgetMin * 1.2) return "Best Value";
  if (price >= prefs.budgetMax * 0.8) return "Premium Alternative";
  return "High-Fit Alternative";
}

function buildTradeoffs(guitar: GuitarModel, prefs: AdvisorPreferences): string[] {
  const tradeoffs: string[] = [];
  if (prefs.strings == null && guitar.strings >= 7) tradeoffs.push(`${guitar.strings}-string instrument`);
  if (guitar.bridgeType === "tremolo") tradeoffs.push("tremolo bridge may require more setup attention");
  if (guitar.artistRelationships.length === 0) tradeoffs.push("not directly tied to the requested artist");
  return tradeoffs;
}

export function recommendGuitars(prefs: AdvisorPreferences, limit = 5): Recommendation[] {
  const eligible = guitars.filter(guitar =>
    withinBudget(guitar, prefs) &&
    stringsFit(guitar, prefs) &&
    tuningFit(guitar, prefs) &&
    hardwareFit(guitar, prefs)
  );

  const scored = eligible
    .map(guitar => {
      const artist = artistScore(guitar, prefs);
      const genre = genreScore(guitar, prefs);
      const score = artist.score + genre.score + availabilityScore(guitar);
      const confidence = Math.min(1, Math.max(0.1, score / 100));
      return {
        guitar,
        score,
        confidence,
        reasons: [...new Set([...artist.reasons, ...genre.reasons])],
        tradeoffs: buildTradeoffs(guitar, prefs)
      };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || (priceForPreferences(a.guitar, prefs) ?? Infinity) - (priceForPreferences(b.guitar, prefs) ?? Infinity));

  const selected: typeof scored = [];
  const seenFamilies = new Set<string>();

  for (const result of scored) {
    const familyKey = `${result.guitar.brand}:${result.guitar.family}:${result.guitar.model}`;
    if (seenFamilies.has(familyKey) && selected.length >= 3) continue;

    selected.push(result);
    seenFamilies.add(familyKey);
    if (selected.length >= limit) break;
  }

  return selected.map((result, index) => ({
    ...result,
    label: classifyLabel(result.guitar, prefs, index)
  }));
}
