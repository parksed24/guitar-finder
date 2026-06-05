export type ProductStatus = "current" | "discontinued" | "limited" | "custom-order";
export type Condition = "new" | "used" | "mint" | "excellent" | "very-good" | "good";
export type RelationshipType =
  | "signature-model"
  | "documented-user"
  | "documented-era"
  | "style-adjacent";

export type RecommendationLabel =
  | "Best Match"
  | "Artist-Authentic Alternative"
  | "Best Value"
  | "Premium Alternative"
  | "High-Fit Alternative";

export interface SourceReference {
  sourceUrl: string;
  sourceType: "manufacturer" | "retailer" | "marketplace" | "manual-review";
  checkedAt: string;
}

export interface ArtistRelationship {
  artist: string;
  relationship: RelationshipType;
  confidence: number;
  sourceUrl: string;
}

export interface GenreFit {
  genre: string;
  score: number;
  reasons: string[];
  confidence: number;
}

export interface GuitarModel {
  id: string;
  brand: string;
  family: string;
  model: string;
  variant?: string;
  finish?: string;
  yearStart?: number;
  yearEnd?: number;
  productionStatus: ProductStatus;

  strings: number;
  scaleLength?: number;
  bridgeType: string;
  pickupConfiguration: string;
  pickupType: "active" | "passive" | "mixed";
  bodyStyle: string;
  tuningSuitability: string[];

  msrp?: number;
  typicalNewPrice?: number;
  typicalUsedLow?: number;
  typicalUsedHigh?: number;

  genres: GenreFit[];
  artistRelationships: ArtistRelationship[];
  sources: SourceReference[];
}

export interface Listing {
  id: string;
  guitarModelId: string;
  seller: string;
  sellerType: "retailer" | "boutique-shop" | "marketplace" | "forum" | "local-marketplace";
  condition: Condition;
  itemPrice: number;
  shipping: number;
  estimatedTax: number;
  estimatedImport: number;
  currency: "USD";
  country: string;
  sourceUrl: string;
  checkedAt: string;
}

export interface FinderSearch {
  brand?: string;
  family?: string;
  model?: string;
  variant?: string;
  finish?: string;
  year?: number;
}

export interface AdvisorPreferences {
  budgetMin: number;
  budgetMax: number;
  genres: string[];
  artists: string[];
  tunings: string[];
  strings?: number;
  pickupType?: "active" | "passive" | "mixed";
  bridgeType?: string;
  conditionPreference: "new-only" | "used-ok" | "used-preferred";
  allowStretchBudget?: boolean;
}

export interface Recommendation {
  guitar: GuitarModel;
  score: number;
  confidence: number;
  label: RecommendationLabel;
  reasons: string[];
  tradeoffs: string[];
}
