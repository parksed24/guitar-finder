"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { uiCopy } from "@/content/ui-copy";
import { safeImageUrl, type ListingImage as ListingImageData } from "@/lib/listing-images";
import { sanitizeSourceText } from "@/lib/source-text";
import {
  activeFilterChips,
  applyFeedFiltersAndSort,
  clearFeedFilters,
  defaultSearchLocation,
  removeFilterChip,
  sortLabels,
  type FeedFilters,
  type ListingCondition,
  type ListingSourceType,
  type SortOption,
  type UnifiedFeedListing
} from "@/lib/feed-filters";

type ViewName = "home" | "results" | "saved" | "product" | "listing" | "advisor";
type ViewMode = "grid" | "list";

interface Listing {
  id: string;
  resultType?: "catalog" | "web";
  source: string;
  logoText?: string;
  sourceType: string;
  status: "New" | "Used";
  brand: string;
  model: string;
  title: string;
  finish: string;
  condition: string;
  country: string;
  total: number;
  item: number;
  shipping: number;
  tax: number;
  import: number;
  returns: string;
  financing: string;
  seller: string;
  location: string;
  freshness: string;
  description: string;
  tags: string[];
  image: string;
  primaryImage?: ListingImageData;
  galleryImages?: ListingImageData[];
  imageSource?: "search-api" | "page-metadata" | "structured-source";
  gallery: string[];
  url: string;
  weight?: string;
  year?: string;
  included?: string;
  conditionNotes?: string;
  retailerDescription?: string;
  snippet?: string;
  sourceDomain?: string;
  confidence?: "Likely exact match" | "Possible match";
  exactMatchConfidence?: number;
  buyabilityScore?: number;
  freshnessStatus?: "recently-checked" | "availability-unverified" | "possibly-stale";
  availabilityWarning?: string;
  possiblePrice?: string;
  itemPrice?: number;
  currency?: string;
  priceLabel?: string;
  availability?: string;
  possibleLocation?: string;
  thumbnailUrl?: string;
}

interface SavedSearch {
  query: string;
  sort: SortOption;
  filters: FeedFilters;
  condition: "both" | "new" | "used";
  frequency: "instant" | "daily" | "weekly";
  targetPrice: number;
  includeInternational: boolean;
}

interface User {
  email: string;
  name: string;
  provider: string;
}

interface AdvisorState {
  step: number;
  budget: string;
  customBudgetMin: string;
  customBudgetMax: string;
  genre: string;
  artist: string;
  tuning: string;
  customTuning: string;
  used: string;
}

interface AdvisorGuitar {
  name: string;
  query: string;
  price: number;
  artists: string[];
  genres: string[];
  strings: number;
  tunings: string[];
  role: string;
  why: string;
  tags: string[];
}

interface PlatformShortcut {
  name: string;
  url: string;
}

interface FinderApiWebResult {
  id: string;
  title: string;
  url: string;
  sourceDomain: string;
  sourceName?: string;
  snippet?: string;
  possiblePrice?: string;
  itemPrice?: number;
  currency?: string;
  priceLabel?: string;
  availability?: string;
  condition?: string;
  sellerName?: string;
  possibleLocation?: string;
  sourceType?: string;
  confidence: "Likely exact match" | "Possible exact match";
  exactMatchConfidence: number;
  buyabilityScore: number;
  freshnessStatus: "recently-checked" | "availability-unverified" | "possibly-stale";
  extractionMethod: "structured-source" | "search-api" | "permitted-page-metadata";
  availabilityWarning?: string;
  thumbnailUrl?: string;
  imageSource?: "search-api" | "page-metadata" | "structured-source";
  primaryImage?: ListingImageData;
  galleryImages?: ListingImageData[];
}

interface FinderApiResponse {
  webResults?: FinderApiWebResult[];
  webSummary?: string;
  shortcuts?: PlatformShortcut[];
  apiConfigured?: boolean;
  searchCompleted?: boolean;
  errorMessage?: string;
  diagnostics?: SearchDiagnostics;
  nextCursor?: string;
  hasMore?: boolean;
  candidateCount?: number;
  qualifiedCount?: number;
  rejectedCount?: number;
}

interface SearchDiagnostics {
  originalQuery: string;
  canonicalQuery: {
    brand?: string;
    model?: string;
    family?: string;
    finish?: string;
    requiredConcepts: string[];
    preferredConcepts: string[];
    excludeTerms: string[];
  };
  queryVariants: string[];
  braveRequestCount: number;
  braveResponseCount: number;
  rawCandidateCount: number;
  duplicateCount: number;
  rejectedCount: number;
  qualifiedCount: number;
  apiErrors: Array<{ query?: string; status?: number; message: string }>;
  rejectionReasons: Record<string, number>;
  metadataFetchAttempts?: number;
  metadataFetchSuccesses?: number;
  jsonLdOfferPricesExtracted?: number;
  searchRichResultPricesExtracted?: number;
  fallbackPriceLabelsUsed?: number;
  rejectedPriceCandidates?: number;
  sourceSpecificParserErrors?: number;
}

const listings: Listing[] = [
  {
    id: "ish",
    source: "Ish Guitars",
    logoText: "ISH",
    weight: "7 lb 11 oz",
    year: "2024",
    included: "Case, paperwork",
    conditionNotes: "New instrument. Shop-inspected before shipment.",
    retailerDescription: "Boutique dealer listing with setup inspection and support.",
    gallery: [
      "https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=1000&q=85"
    ],
    sourceType: "Boutique shop",
    status: "New",
    brand: "PRS",
    model: "Mark Holcomb Core",
    title: "PRS Mark Holcomb Core",
    finish: "Cobalt Smokeburst",
    condition: "New",
    country: "US",
    total: 5307,
    item: 4899,
    shipping: 65,
    tax: 343,
    import: 0,
    returns: "Store policy",
    financing: "Available",
    seller: "Ish Guitars",
    location: "Syracuse, NY",
    freshness: "Checked 2 hours ago",
    description: "Exact PRS Mark Holcomb Core in Cobalt Smokeburst from a boutique dealer. Includes shop inspection and setup support.",
    tags: ["Rare finish", "Setup inspected"],
    image: "https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=800&q=85",
    url: "https://ish.guitars/search?q=PRS%20Holcomb%20Core%20Cobalt%20Smokeburst"
  },
  {
    id: "sweetwater",
    source: "Sweetwater",
    logoText: "SW",
    weight: "7 lb 9 oz",
    year: "2024",
    included: "Hardshell case",
    conditionNotes: "Brand-new authorized-dealer inventory.",
    retailerDescription: "Exact model and finish with financing and return support.",
    gallery: [
      "https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=1000&q=85"
    ],
    sourceType: "Large retailer",
    status: "New",
    brand: "PRS",
    model: "Mark Holcomb Core",
    title: "PRS Mark Holcomb Core",
    finish: "Cobalt Smokeburst",
    condition: "New",
    country: "US",
    total: 5349,
    item: 4999,
    shipping: 0,
    tax: 350,
    import: 0,
    returns: "Easy returns",
    financing: "0% financing",
    seller: "Sweetwater",
    location: "Fort Wayne, IN",
    freshness: "Checked today",
    description: "Authorized retailer option with financing and returns. Exact model and finish match.",
    tags: ["0% financing", "Easy returns"],
    image: "https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=800&q=85",
    url: "https://www.sweetwater.com/store/search?s=PRS%20Holcomb%20Core%20Cobalt%20Smokeburst"
  },
  {
    id: "reverb",
    source: "Reverb",
    logoText: "R",
    weight: "Not listed",
    year: "2023",
    included: "Case included",
    conditionNotes: "Mint used. Seller notes minimal handling wear only.",
    retailerDescription: "Marketplace listing with buyer protection and seller offers enabled.",
    gallery: [
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1000&q=85"
    ],
    sourceType: "Marketplace",
    status: "Used",
    brand: "PRS",
    model: "Mark Holcomb Core",
    title: "PRS Mark Holcomb Core",
    finish: "Cobalt Smokeburst",
    condition: "Mint used",
    country: "US",
    total: 4702,
    item: 4299,
    shipping: 95,
    tax: 308,
    import: 0,
    returns: "Seller policy",
    financing: "Varies",
    seller: "Marketplace seller",
    location: "US seller",
    freshness: "Listed yesterday",
    description: "Used marketplace listing with buyer protection. Exact model and finish match.",
    tags: ["Buyer protection", "Seller offers"],
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=85",
    url: "https://reverb.com/marketplace?query=PRS%20Holcomb%20Core%20Cobalt%20Smokeburst"
  },
  {
    id: "tgp",
    source: "The Gear Page",
    logoText: "TGP",
    weight: "Approx. 7.8 lb",
    year: "2023",
    included: "Case, strap locks",
    conditionNotes: "Excellent used. Private seller mentions light pick wear.",
    retailerDescription: "Forum classified. Ask seller for detailed photos and serial verification.",
    gallery: [
      "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=1000&q=85"
    ],
    sourceType: "Forum classifieds",
    status: "Used",
    brand: "PRS",
    model: "Mark Holcomb Core",
    title: "PRS Mark Holcomb Core",
    finish: "Cobalt Smokeburst",
    condition: "Excellent used",
    country: "US",
    total: 4230,
    item: 4150,
    shipping: 80,
    tax: 0,
    import: 0,
    returns: "Private sale",
    financing: "No",
    seller: "Forum member",
    location: "US seller",
    freshness: "Forum post",
    description: "Forum classified listing. Exact model and finish match, but private-sale terms apply.",
    tags: ["Private sale", "Ask questions"],
    image: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=800&q=85",
    url: "https://www.thegearpage.net/board/index.php?search/search&keywords=PRS%20Holcomb%20Core%20Cobalt%20Smokeburst"
  },
  {
    id: "fb",
    source: "Facebook Marketplace",
    logoText: "FB",
    weight: "Not listed",
    year: "Not listed",
    included: "Ask seller",
    conditionNotes: "Used local listing. Inspect in person before purchase.",
    retailerDescription: "Local listing with pickup only. Confirm finish, serial, and condition in person.",
    gallery: [
      "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=1000&q=85"
    ],
    sourceType: "Local marketplace",
    status: "Used",
    brand: "PRS",
    model: "Mark Holcomb Core",
    title: "PRS Mark Holcomb Core",
    finish: "Cobalt Smokeburst",
    condition: "Used local",
    country: "US",
    total: 4050,
    item: 4050,
    shipping: 0,
    tax: 0,
    import: 0,
    returns: "Private sale",
    financing: "No",
    seller: "Local seller",
    location: "Local pickup",
    freshness: "Local listing",
    description: "Local-marketplace listing. Exact model and finish match. Meet safely and inspect the instrument before purchase.",
    tags: ["Local pickup", "Meet safely"],
    image: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?auto=format&fit=crop&w=800&q=85",
    url: "https://www.facebook.com/marketplace/search/?query=PRS%20Holcomb%20Core%20Cobalt%20Smokeburst"
  },
  {
    id: "ebay",
    source: "eBay Japan",
    logoText: "eB",
    weight: "Not listed",
    year: "2023",
    included: "Case included",
    conditionNotes: "Excellent used. International seller describes minor handling wear.",
    retailerDescription: "International listing with import estimate and buyer protection.",
    gallery: [
      "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=85"
    ],
    sourceType: "International marketplace",
    status: "Used",
    brand: "PRS",
    model: "Mark Holcomb Core",
    title: "PRS Mark Holcomb Core",
    finish: "Cobalt Smokeburst",
    condition: "Excellent used",
    country: "Japan",
    total: 4693,
    item: 3999,
    shipping: 240,
    tax: 298,
    import: 156,
    returns: "Seller policy",
    financing: "Varies",
    seller: "International seller",
    location: "Japan",
    freshness: "Checked today",
    description: "International listing with estimated landed cost including shipping, tax, and import. Exact model and finish match.",
    tags: ["Import estimate", "Buyer protection"],
    image: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=800&q=85",
    url: "https://www.ebay.com/sch/i.html?_nkw=PRS%20Holcomb%20Core%20Cobalt%20Smokeburst"
  },
  {
    id: "gc",
    source: "Guitar Center",
    logoText: "GC",
    weight: "Not listed",
    year: "2024",
    included: "Gig bag",
    conditionNotes: "New inventory.",
    retailerDescription: "Incorrect SE variant retained in seed data only to validate strict filtering.",
    gallery: ["https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=1000&q=85"],
    sourceType: "Large retailer",
    status: "New",
    brand: "PRS",
    model: "SE Mark Holcomb",
    title: "PRS SE Mark Holcomb",
    finish: "Holcomb Burst",
    condition: "New",
    country: "US",
    total: 1283,
    item: 1199,
    shipping: 0,
    tax: 84,
    import: 0,
    returns: "45-day returns",
    financing: "Available",
    seller: "Guitar Center",
    location: "US",
    freshness: "Checked today",
    description: "Related but incorrect SE model. This should not appear for a Core search.",
    tags: ["Store pickup", "45-day returns"],
    image: "https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=800&q=85",
    url: "https://www.guitarcenter.com/search?Ntt=PRS%20SE%20Mark%20Holcomb"
  },
  prototypeListing("jackson-misha-ht6", "Wildwood Guitars", "Boutique shop", "Jackson", "USA Signature Misha Mansoor Juggernaut HT6", "Jackson USA Signature Misha Mansoor Juggernaut HT6", "Satin Silver", 4706, 4399, ["Artist signature", "Hardtail"]),
  prototypeListing("jackson-misha-ht7fm", "Ish Guitars", "Boutique shop", "Jackson", "USA Signature Misha Mansoor Juggernaut HT7FM", "Jackson USA Signature Misha Mansoor Juggernaut HT7FM", "Satin Laguna Burst", 5296, 4950, ["Artist signature", "7 string"]),
  prototypeListing("mayones-duvell7", "Dijkmans Muziek", "International retailer", "Mayones", "Duvell Elite 7", "Mayones Duvell Elite 7", "Custom finish", 4585, 3995, ["7 string", "Modern metal"], "Netherlands", 190, 250, 150),
  prototypeListing("musicman-jp15", "Sweetwater", "Large retailer", "Music Man", "JP15 7 String", "Ernie Ball Music Man JP15 7 String", "Green Tiger Eye", 4279, 3999, ["7 string", "Piezo"]),
  prototypeListing("musicman-majesty", "Guitar Center", "Large retailer", "Music Man", "Majesty", "Ernie Ball Music Man Majesty", "Arctic Dream", 4814, 4499, ["Prog metal", "Piezo"])
];

const advisorCatalog: AdvisorGuitar[] = [
  { name: "Jackson USA Signature Misha Mansoor Juggernaut HT6", query: "Jackson USA Signature Misha Mansoor Juggernaut HT6 Satin Silver", price: 4399, artists: ["misha mansoor", "periphery"], genres: ["djent", "metalcore", "progressive metal"], strings: 6, tunings: ["standard", "drop d", "drop c"], role: "Direct artist signature", why: "The clearest 6-string artist-authentic option for a Misha Mansoor-inspired setup.", tags: ["Misha signature", "Hardtail", "Progressive metal"] },
  { name: "Jackson USA Signature Misha Mansoor Juggernaut HT7FM", query: "Jackson USA Signature Misha Mansoor Juggernaut HT7FM Satin Laguna Burst", price: 4950, artists: ["misha mansoor", "periphery"], genres: ["djent", "metalcore", "progressive metal"], strings: 7, tunings: ["drop a", "drop g#", "drop c"], role: "Direct artist signature", why: "A premium 7-string Misha signature option when extended range is important.", tags: ["Misha signature", "7 string", "Hardtail"] },
  { name: "Jackson Pro Plus Signature Misha Mansoor Juggernaut HT7", query: "Jackson Pro Plus Signature Misha Mansoor Juggernaut HT7", price: 1199, artists: ["misha mansoor", "periphery"], genres: ["djent", "metalcore", "progressive metal"], strings: 7, tunings: ["drop a", "drop g#", "drop c"], role: "Lower-priced signature", why: "A lower-priced artist-authentic option, shown only when it fits the selected budget.", tags: ["Misha signature", "7 string", "Value"] },
  { name: "Mayones Duvell Elite 7", query: "Mayones Duvell Elite 7", price: 3995, artists: [], genres: ["djent", "metalcore", "progressive metal"], strings: 7, tunings: ["drop a", "drop g#", "drop c"], role: "High-fit alternate", why: "A premium modern-metal alternate with extended-range capability and boutique positioning.", tags: ["7 string", "Boutique", "Modern metal"] },
  { name: "Ernie Ball Music Man JP15 7 String", query: "Music Man JP15 7 String Green Tiger Eye", price: 3999, artists: ["john petrucci"], genres: ["progressive metal", "djent", "rock"], strings: 7, tunings: ["standard", "drop a", "drop c"], role: "High-fit alternate", why: "A premium 7-string alternate with broad tonal flexibility for technical progressive playing.", tags: ["7 string", "Piezo", "Versatile"] },
  { name: "Ernie Ball Music Man Majesty", query: "Music Man Majesty Arctic Dream", price: 4499, artists: ["john petrucci"], genres: ["progressive metal", "djent", "rock"], strings: 6, tunings: ["standard", "drop d", "eb"], role: "High-fit alternate", why: "A premium prog-oriented alternate with ergonomic design and versatile electronics.", tags: ["Prog metal", "Piezo", "Premium"] },
  { name: "Ibanez JBBM40 JB Brubaker Signature", query: "Ibanez JBBM40 Black Flat", price: 1199, artists: ["jb brubaker", "august burns red"], genres: ["metalcore"], strings: 6, tunings: ["drop c", "drop b"], role: "Direct artist signature", why: "The correct JB Brubaker signature option for August Burns Red-inspired metalcore playing.", tags: ["JB Brubaker signature", "Active pickups", "Metalcore"] },
  { name: "G&L Tribute ASAT Classic", query: "G&L Tribute ASAT Classic Butterscotch", price: 649, artists: ["brad paisley"], genres: ["country", "bluegrass"], strings: 6, tunings: ["standard", "drop d"], role: "Best value", why: "Tele-style attack and bridge clarity make this a strong country-focused value option.", tags: ["Tele style", "Country", "Value"] },
  { name: "Fender Player Telecaster", query: "Fender Player Telecaster Butterscotch", price: 849, artists: ["brad paisley"], genres: ["country", "bluegrass", "indie"], strings: 6, tunings: ["standard", "drop d"], role: "High-fit alternate", why: "A recognizable Tele-style platform with bright attack and simple hardtail stability.", tags: ["Tele style", "Hardtail", "Workhorse"] },
  { name: "Fender Player Stratocaster HSS", query: "Fender Player Stratocaster HSS", price: 849, artists: ["john mayer"], genres: ["blues", "rock", "funk", "pop"], strings: 6, tunings: ["standard", "eb", "drop d"], role: "High-fit alternate", why: "A flexible HSS option with broad coverage for blues, funk, pop, and rock.", tags: ["HSS", "Versatile", "Tremolo"] }
];

function prototypeListing(
  id: string,
  source: string,
  sourceType: string,
  brand: string,
  model: string,
  title: string,
  finish: string,
  total: number,
  item: number,
  tags: string[],
  country = "US",
  shipping = 0,
  tax = Math.round(item * 0.07),
  importDuty = 0
): Listing {
  return {
    id,
    source,
    logoText: source.slice(0, 2).toUpperCase(),
    sourceType,
    status: "New",
    brand,
    model,
    title,
    finish,
    condition: "New",
    country,
    total,
    item,
    shipping,
    tax,
    import: importDuty,
    returns: "Store policy",
    financing: "Available",
    seller: source,
    location: country === "US" ? "US" : country,
    freshness: "Prototype listing",
    description: `Prototype exact-match listing for ${title}.`,
    tags,
    weight: "Not listed",
    year: "2024",
    included: "Ask retailer",
    conditionNotes: `New ${title} listing.`,
    retailerDescription: `Prototype listing for ${title}.`,
    image: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=800&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1000&q=85"
    ],
    url: "#"
  };
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const normalize = (value: string | number | undefined) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function webResultToListing(result: FinderApiWebResult): Listing {
  const domain = result.sourceDomain.replace(/^www\./, "");
  const sourceNotes = sanitizeSourceText(result.snippet);
  return {
    id: `web-${result.id}`,
    resultType: "web",
    source: result.sourceName || domain,
    logoText: (result.sourceName || domain).slice(0, 2).toUpperCase(),
    sourceType: result.sourceType || "retailer",
    status: "Used",
    brand: "",
    model: result.title,
    title: result.title,
    finish: sourceNotes || uiCopy.listing.confirmDetails,
    condition: result.condition || "",
    country: result.possibleLocation || "Online",
    total: 0,
    item: 0,
    shipping: 0,
    tax: 0,
    import: 0,
    returns: "",
    financing: "",
    seller: result.sellerName || result.sourceName || domain,
    location: result.possibleLocation || domain,
    freshness: result.availability || result.availabilityWarning || "Open the listing to confirm availability.",
    description: sourceNotes || "Open the listing to confirm model, finish, price, condition, and availability.",
    tags: [],
    image: result.primaryImage?.url || result.thumbnailUrl || "",
    primaryImage: result.primaryImage,
    galleryImages: result.galleryImages,
    imageSource: result.imageSource,
    gallery: result.galleryImages?.map(image => image.url).filter((url): url is string => Boolean(url)) ?? (result.thumbnailUrl ? [result.thumbnailUrl] : []),
    url: result.url,
    snippet: sourceNotes,
    sourceDomain: domain,
    confidence: result.confidence === "Possible exact match" ? uiCopy.listing.possibleMatch : uiCopy.listing.likelyExactMatch,
    exactMatchConfidence: result.exactMatchConfidence,
    buyabilityScore: result.buyabilityScore,
    freshnessStatus: result.freshnessStatus,
    availabilityWarning: result.availabilityWarning,
    possiblePrice: result.priceLabel || result.possiblePrice,
    itemPrice: result.itemPrice,
    currency: result.currency,
    priceLabel: result.priceLabel,
    availability: result.availability,
    possibleLocation: result.possibleLocation,
    thumbnailUrl: result.thumbnailUrl,
    retailerDescription: sourceNotes
  };
}

function strictMatch(listing: Listing, query: string) {
  const hay = normalize(`${listing.brand} ${listing.model} ${listing.finish}`);
  const tokens = normalize(query)
    .split(" ")
    .filter(token => token && !["guitar", "electric", "for", "sale", "new", "used", "the"].includes(token));

  return tokens.every(token => hay.includes(token)) && !(tokens.includes("core") && hay.includes(" se "));
}

function tagTone(tag: string) {
  const text = tag.toLowerCase();
  if (text.includes("import") || text.includes("private") || text.includes("safely")) return "warn";
  if (text.includes("financing") || text.includes("returns") || text.includes("pickup") || text.includes("rare") || text.includes("protection") || text.includes("setup")) return "good";
  return "";
}

function parsePossiblePrice(value?: string) {
  if (!value) return undefined;
  const match = value.replace(/,/g, "").match(/\$?\s*(\d{3,6})/);
  return match ? Number(match[1]) : undefined;
}

function normalizedSourceType(listing: Listing): ListingSourceType {
  const type = normalize(listing.sourceType);
  const country = normalize(listing.country);
  if (type.includes("forum")) return "forum-classified";
  if (type.includes("local") || type.includes("classified")) return "local-classified";
  if (type.includes("boutique")) return "boutique";
  if (type.includes("marketplace")) return country && country !== "us" && country !== "web" ? "international-retailer" : "marketplace";
  if (type.includes("international") || (country && country !== "us" && country !== "web")) return "international-retailer";
  return "retailer";
}

function normalizedCondition(listing: Listing): ListingCondition | undefined {
  const value = normalize(`${listing.condition} ${listing.status}`);
  if (value.includes("mint")) return "mint";
  if (value.includes("excellent")) return "excellent";
  if (value.includes("very good")) return "very-good";
  if (value.includes("good")) return "good";
  if (value.includes("new")) return "new";
  return undefined;
}

function normalizedCountry(listing: Listing) {
  const country = normalize(listing.country);
  if (!country || country === "web") return undefined;
  if (country === "us" || country === "usa" || country.includes("united states")) return "US";
  return listing.country;
}

const prototypeDistances: Record<string, number> = {
  "Syracuse, NY": 650,
  "Fort Wayne, IN": 520,
  "US seller": 125,
  "Local pickup": 18,
  US: 250,
  Japan: 6800,
  Netherlands: 4100
};

function freshnessStatusFor(listing: Listing): UnifiedFeedListing["freshnessStatus"] {
  if (listing.freshnessStatus) return listing.freshnessStatus;
  const freshness = normalize(listing.freshness);
  if (freshness.includes("checked") || freshness.includes("today")) return "recently-checked";
  if (freshness.includes("prototype") || freshness.includes("listed") || freshness.includes("local") || freshness.includes("forum")) return "availability-unverified";
  return "possibly-stale";
}

function toUnifiedFeedListing(listing: Listing): UnifiedFeedListing {
  const itemPrice = listing.item > 0 ? listing.item : listing.itemPrice ?? parsePossiblePrice(listing.possiblePrice);
  const country = normalizedCountry(listing);
  const sourceType = normalizedSourceType(listing);
  const freshnessStatus = freshnessStatusFor(listing);
  const distanceMiles = listing.resultType === "web" ? undefined : prototypeDistances[listing.location] ?? prototypeDistances[listing.country];
  const localPickup = listing.tags.some(tag => normalize(tag).includes("local pickup")) || sourceType === "local-classified";
  const shipsToUser = listing.resultType === "web" ? undefined : !localPickup || listing.shipping > 0 || sourceType !== "local-classified";
  const totalEstimatedCost = listing.total > 0 ? listing.total : undefined;
  const totalCostComplete = listing.resultType !== "web" && totalEstimatedCost !== undefined;
  return {
    id: listing.id,
    sourceName: listing.source,
    sourceDomain: listing.sourceDomain || listing.url.replace(/^https?:\/\//, "").split("/")[0] || listing.source,
    sourceType,
    title: listing.title,
    url: listing.url,
    imageUrl: listing.primaryImage?.url || listing.image || undefined,
    primaryImage: sourceImageForListing(listing),
    galleryImages: galleryImagesForListing(listing),
    condition: normalizedCondition(listing),
    locationLabel: listing.possibleLocation || listing.location || listing.country,
    distanceMiles,
    localPickup,
    shipsToUser,
    country,
    itemPrice,
    shipping: listing.shipping > 0 ? listing.shipping : listing.resultType === "web" ? undefined : 0,
    estimatedTax: listing.tax > 0 ? listing.tax : listing.resultType === "web" ? undefined : 0,
    estimatedImport: listing.import > 0 ? listing.import : country && country !== "US" && listing.resultType !== "web" ? 0 : undefined,
    totalEstimatedCost,
    totalCostComplete,
    financingAvailable: normalize(listing.financing).includes("available") || normalize(listing.financing).includes("0 financing"),
    offersAccepted: listing.tags.some(tag => normalize(tag).includes("offer")),
    returnsAccepted: Boolean(listing.returns && !normalize(listing.returns).includes("no") && !normalize(listing.returns).includes("private")),
    exactMatchConfidence: listing.exactMatchConfidence ?? 0.9,
    buyabilityScore: listing.buyabilityScore ?? (sourceType === "retailer" || sourceType === "boutique" ? 0.95 : sourceType === "marketplace" ? 0.84 : 0.7),
    freshnessConfidence: freshnessStatus === "recently-checked" ? 1 : freshnessStatus === "availability-unverified" ? 0.55 : 0.16,
    freshnessStatus,
    checkedAt: freshnessStatus === "recently-checked" ? new Date().toISOString() : undefined,
    createdAt: normalize(listing.freshness).includes("listed yesterday") ? new Date(Date.now() - 86_400_000).toISOString() : undefined
  };
}

function buyingContext(listing: Listing) {
  const feed = toUnifiedFeedListing(listing);
  const parts: string[] = [];
  if (feed.distanceMiles !== undefined && feed.distanceMiles <= 250) parts.push(`${Math.round(feed.distanceMiles)} miles away`);
  else if (feed.locationLabel && listing.resultType !== "web") parts.push(feed.locationLabel);
  else if (listing.possibleLocation) parts.push(listing.possibleLocation);
  if (feed.localPickup) parts.push("Local pickup");
  else if (feed.shipsToUser) parts.push("Ships to you");
  return parts.join(" · ");
}

function availabilityLine(listing: Listing) {
  if (listing.availability && /instock|in stock|available/i.test(listing.availability)) return "In stock";
  if (listing.freshness && !/possible|unverified|open the listing/i.test(listing.freshness)) return listing.freshness;
  return "Open the listing to confirm availability.";
}

function visibleCondition(listing: Listing) {
  if (!listing.condition || /possible|likely exact|match/i.test(listing.condition)) return undefined;
  return listing.condition;
}

function listingDetailSubtitle(listing: Listing) {
  if (listing.resultType !== "web") return listing.finish;
  return [visibleCondition(listing), listing.possibleLocation].filter(Boolean).join(" · ");
}

function sourceImageForListing(listing: Listing): ListingImageData | undefined {
  const url = safeImageUrl(listing.primaryImage?.url || listing.image);
  if (!url) return undefined;
  return listing.primaryImage ?? {
    url,
    source: listing.imageSource === "page-metadata" ? "open-graph" : listing.imageSource === "structured-source" ? "structured-api" : "search-thumbnail",
    alt: listing.title,
    isSourceBacked: true,
    validationStatus: "valid",
    fit: listing.resultType === "web" ? "cover" : "contain"
  };
}

function galleryImagesForListing(listing: Listing): ListingImageData[] {
  const explicit = listing.galleryImages?.length ? listing.galleryImages : listing.gallery.map(url => ({
    url,
    source: listing.imageSource === "page-metadata" ? "open-graph" as const : "search-thumbnail" as const,
    alt: listing.title,
    isSourceBacked: true,
    validationStatus: "unchecked" as const,
    fit: listing.resultType === "web" ? "cover" as const : "contain" as const
  }));
  const seen = new Set<string>();
  return explicit.filter(image => {
    const url = safeImageUrl(image.url);
    if (!url || seen.has(url)) return false;
    seen.add(url);
    image.url = url;
    return true;
  });
}

function imageCandidatesForListing(listing: Listing) {
  const images = galleryImagesForListing(listing);
  const primary = sourceImageForListing(listing);
  const merged = [primary, ...images].filter((image): image is ListingImageData => Boolean(image));
  const seen = new Set<string>();
  return merged.filter(image => {
    const url = safeImageUrl(image.url);
    if (!url || seen.has(url)) return false;
    seen.add(url);
    image.url = url;
    return true;
  });
}

const defaultAdvisor: AdvisorState = {
  step: 0,
  budget: "$1,000-$1,500",
  customBudgetMin: "",
  customBudgetMax: "",
  genre: "Country",
  artist: "Brad Paisley",
  tuning: "Standard",
  customTuning: "",
  used: "Yes"
};

const advisorSteps = ["budget", "genre", "artist", "tuning", "used", "result"];

export default function FinderExperience() {
  const [view, setView] = useState<ViewName>("home");
  const [homeQuery, setHomeQuery] = useState("");
  const [finderQuery, setFinderQuery] = useState("");
  const [feedFilters, setFeedFilters] = useState<FeedFilters>(() => clearFeedFilters());
  const [draftFilters, setDraftFilters] = useState<FeedFilters>(() => clearFeedFilters());
  const [sortOption, setSortOption] = useState<SortOption>("recommended");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>("grid");
  const [exactResults, setExactResults] = useState<Listing[]>([]);
  const [webSummary, setWebSummary] = useState<string>(uiCopy.home.searchIdle);
  const [platformLinks, setPlatformLinks] = useState<PlatformShortcut[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchCursor, setSearchCursor] = useState<string | null>(null);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [resultsExhausted, setResultsExhausted] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchDiagnostics, setSearchDiagnostics] = useState<SearchDiagnostics | null>(null);
  const [apiConfigured, setApiConfigured] = useState(true);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [compare, setCompare] = useState<Set<string>>(new Set());
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [currentListingId, setCurrentListingId] = useState<string | null>(null);
  const [listingDirection, setListingDirection] = useState<"next" | "prev" | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authTitle, setAuthTitle] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [pendingAlertQuery, setPendingAlertQuery] = useState<string | null>(null);
  const [alertCondition, setAlertCondition] = useState<SavedSearch["condition"]>("both");
  const [alertFrequency, setAlertFrequency] = useState<SavedSearch["frequency"]>("instant");
  const [alertInternational, setAlertInternational] = useState(true);
  const [alertTargetPrice, setAlertTargetPrice] = useState("");
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [advisorState, setAdvisorState] = useState<AdvisorState>(defaultAdvisor);
  const afterAuthRef = useRef<null | (() => void)>(null);

  const feedListingMap = useMemo(() => new Map(exactResults.map(listing => [listing.id, toUnifiedFeedListing(listing)])), [exactResults]);
  const orderedFeedListings = useMemo(() => applyFeedFiltersAndSort([...feedListingMap.values()], feedFilters, sortOption), [feedFilters, feedListingMap, sortOption]);
  const visibleResults = useMemo(() => {
    const source = new Map(exactResults.map(listing => [listing.id, listing]));
    return orderedFeedListings.map(listing => source.get(listing.id)).filter((listing): listing is Listing => Boolean(listing));
  }, [exactResults, orderedFeedListings]);
  const draftResultCount = useMemo(() => applyFeedFiltersAndSort([...feedListingMap.values()], draftFilters, sortOption).length, [draftFilters, feedListingMap, sortOption]);
  const activeChips = useMemo(() => activeFilterChips(feedFilters), [feedFilters]);
  const debugEnabled = useMemo(() => process.env.NODE_ENV !== "production" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1", []);

  const productListing = exactResults.find(listing => listing.id === currentProductId) ?? listings.find(listing => listing.id === currentProductId) ?? exactResults[0] ?? listings[0];
  const currentListing = visibleResults.find(listing => listing.id === currentListingId) ?? exactResults.find(listing => listing.id === currentListingId) ?? listings.find(listing => listing.id === currentListingId) ?? visibleResults[0] ?? exactResults[0] ?? listings[0];
  const listingItems = exactResults.length ? visibleResults : listings;
  const listingIndex = Math.max(0, listingItems.findIndex(item => item.id === currentListing.id));
  const currentGallery = galleryImagesForListing(currentListing);
  const comparedListings = (exactResults.length ? visibleResults : listings).filter(listing => compare.has(listing.id));

  function navigate(nextView: ViewName) {
    setView(nextView);
  }

  function resetFilterUI() {
    const cleared = clearFeedFilters();
    setFeedFilters(cleared);
    setDraftFilters(cleared);
    setSortOption("recommended");
  }

  function goHome() {
    resetFilterUI();
    setCompare(new Set());
    setView("home");
  }

  async function runSearch(query = finderQuery, refresh = false, controls?: { filters?: FeedFilters; sort?: SortOption; preserveControls?: boolean }) {
    const trimmed = query.trim();
    setFinderQuery(trimmed);
    setHomeQuery(trimmed);
    setExactResults([]);
    setSearching(Boolean(trimmed));
    setLoadingMore(false);
    setSearchCursor(null);
    setHasMoreResults(false);
    setResultsExhausted(false);
    setSearchError(null);
    setSearchDiagnostics(null);
    setWebSummary(trimmed ? uiCopy.results.loading : uiCopy.home.searchIdle);
    if (controls?.filters) {
      setFeedFilters(controls.filters);
      setDraftFilters(controls.filters);
    }
    if (controls?.sort) setSortOption(controls.sort);
    if (!controls?.filters && !controls?.sort && !controls?.preserveControls) resetFilterUI();
    setView("results");

    if (!trimmed) {
      setSearching(false);
      return;
    }

    try {
      const response = await fetch("/api/finder/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, refresh })
      });
      const body = await response.json() as FinderApiResponse;
      const completed = body.searchCompleted !== false;
      setExactResults(completed ? (body.webResults ?? []).map(webResultToListing) : []);
      setWebSummary(body.webSummary || uiCopy.emptyStates.noExactMatchesTitle);
      setSearchError(completed ? null : body.errorMessage || uiCopy.errors.searchFailed);
      setSearchDiagnostics(body.diagnostics ?? null);
      setPlatformLinks(body.shortcuts ?? []);
      setSearchCursor(body.nextCursor ?? null);
      setHasMoreResults(completed && Boolean(body.hasMore && body.nextCursor));
      setResultsExhausted(completed && Boolean(trimmed && !body.hasMore));
      setApiConfigured(body.apiConfigured ?? true);
    } catch {
      setExactResults([]);
      setWebSummary(uiCopy.errors.searchFailed);
      setSearchError(uiCopy.errors.searchFailed);
      setPlatformLinks([]);
      setSearchDiagnostics(null);
      setSearchCursor(null);
      setHasMoreResults(false);
      setResultsExhausted(false);
      setApiConfigured(false);
    } finally {
      setSearching(false);
    }
  }

  async function loadMoreResults() {
    if (!finderQuery.trim() || !searchCursor || loadingMore) return;
    setLoadingMore(true);
    setWebSummary(previous => previous.includes(uiCopy.results.loadingMore) ? previous : `${previous} · ${uiCopy.results.loadingMore}`);
    try {
      const response = await fetch("/api/finder/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: finderQuery.trim(), cursor: searchCursor })
      });
      const body = await response.json() as FinderApiResponse;
      if (body.searchCompleted === false) {
        setSearchError(body.errorMessage || uiCopy.errors.loadMoreFailed);
        setSearchDiagnostics(body.diagnostics ?? null);
        setWebSummary(body.webSummary || uiCopy.errors.loadMoreFailed);
        setHasMoreResults(false);
        setResultsExhausted(false);
        return;
      }
      const incoming = (body.webResults ?? []).map(webResultToListing);
      setExactResults(previous => {
        const seen = new Set(previous.map(listing => listing.url || listing.id));
        const next = [...previous];
        for (const listing of incoming) {
          const key = listing.url || listing.id;
          if (!seen.has(key)) {
            seen.add(key);
            next.push(listing);
          }
        }
        return next;
      });
      setWebSummary(body.webSummary || (body.hasMore ? uiCopy.results.likelyMatchesFoundSoFar(exactResults.length + incoming.length) : uiCopy.results.likelyMatchesFound(exactResults.length + incoming.length)));
      setSearchError(null);
      setSearchDiagnostics(body.diagnostics ?? searchDiagnostics);
      setPlatformLinks(body.shortcuts ?? platformLinks);
      setSearchCursor(body.nextCursor ?? null);
      setHasMoreResults(Boolean(body.hasMore && body.nextCursor));
      setResultsExhausted(!body.hasMore);
      setApiConfigured(body.apiConfigured ?? true);
    } catch {
      setWebSummary(uiCopy.errors.loadMoreFailed);
      setSearchError(uiCopy.errors.loadMoreFailed);
    } finally {
      setLoadingMore(false);
    }
  }

  function runHomeSearch() {
    if (!homeQuery.trim()) return;
    void runSearch(homeQuery);
  }

  function quickSearch(query: string) {
    setHomeQuery(query);
    void runSearch(query);
  }

  function resetFeed() {
    setExactResults([]);
    setFinderQuery("");
    setHomeQuery("");
    setWebSummary(uiCopy.home.searchIdle);
    setPlatformLinks([]);
    setSearching(false);
    setLoadingMore(false);
    setSearchCursor(null);
    setHasMoreResults(false);
    setResultsExhausted(false);
    setSearchError(null);
    setSearchDiagnostics(null);
    resetFilterUI();
    setCompare(new Set());
    setView("home");
  }

  function openAuth(title: string, afterAuth?: () => void) {
    afterAuthRef.current = afterAuth ?? null;
    setAuthTitle(title);
  }

  function finishLogin(email: string, provider: string) {
    const safeEmail = email.includes("@") ? email : `${provider.toLowerCase()}-user@example.com`;
    setCurrentUser({ email: safeEmail, name: safeEmail.split("@")[0] || "Guitar shopper", provider });
    setAuthTitle(null);
    setAuthEmail("");
    const afterAuth = afterAuthRef.current;
    afterAuthRef.current = null;
    window.setTimeout(() => afterAuth?.(), 0);
  }

  function toggleSave(id: string) {
    if (!currentUser) {
      openAuth("Save this listing", () => toggleSave(id));
      return;
    }
    setSaved(previous => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCompare(id: string) {
    setCompare(previous => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function requestSaveSearch() {
    if (!finderQuery.trim()) return;
    if (!currentUser) {
      openAuth("Save this search", () => openAlertSettings(finderQuery));
      return;
    }
    openAlertSettings(finderQuery);
  }

  function openAlertSettings(query: string) {
    setPendingAlertQuery(query);
    setAlertCondition("both");
    setAlertFrequency("instant");
    setAlertInternational(true);
    setAlertTargetPrice("");
  }

  function saveAlert() {
    if (!pendingAlertQuery) return;
    const record: SavedSearch = {
      query: pendingAlertQuery,
      sort: sortOption,
      filters: feedFilters,
      condition: alertCondition,
      frequency: alertFrequency,
      targetPrice: Number(alertTargetPrice || 0),
      includeInternational: alertInternational
    };
    setSavedSearches(previous => {
      const withoutExisting = previous.filter(item => item.query !== record.query);
      return [record, ...withoutExisting];
    });
    setPendingAlertQuery(null);
    setView("saved");
  }

  function showSaved() {
    setView("saved");
  }

  function openProduct(id: string) {
    setCurrentProductId(id);
    setView("product");
  }

  function openListing(id: string, direction?: "next" | "prev") {
    setCurrentListingId(id);
    setGalleryIndex(0);
    setShowBreakdown(false);
    setListingDirection(direction ?? null);
    setView("listing");
    if (direction) window.setTimeout(() => setListingDirection(null), 320);
  }

  function openAdjacentListing(direction: -1 | 1) {
    const nextIndex = listingIndex + direction;
    if (nextIndex < 0 || nextIndex >= listingItems.length) return;
    openListing(listingItems[nextIndex].id, direction > 0 ? "next" : "prev");
  }

  function openFilters() {
    setDraftFilters(feedFilters);
    setShowFilterSheet(true);
  }

  function applyFilters() {
    setFeedFilters(draftFilters);
    setShowFilterSheet(false);
  }

  function removeChip(id: string) {
    setFeedFilters(previous => {
      const next = removeFilterChip(previous, id);
      setDraftFilters(next);
      return next;
    });
  }

  function clearAppliedFilters() {
    const cleared = clearFeedFilters();
    setFeedFilters(cleared);
    setDraftFilters(cleared);
  }

  function runSavedSearch(item: SavedSearch) {
    void runSearch(item.query, false, { filters: item.filters, sort: item.sort });
  }

  function stepGallery(direction: -1 | 1) {
    setGalleryIndex(previous => (previous + direction + currentGallery.length) % currentGallery.length);
  }

  function signOut() {
    setCurrentUser(null);
    setSaved(new Set());
    setSavedSearches([]);
    setShowAccount(false);
    setView("home");
  }

  function advisorBudgetRange() {
    const presets: Record<string, [number, number]> = {
      "Under $1,000": [0, 999],
      "$1,000-$1,500": [1000, 1500],
      "$1,500-$3,000": [1500, 3000],
      "$3,000-$5,000": [3000, 5000],
      "$5,000+": [5000, 99999]
    };
    if (advisorState.budget === "Custom range") return [Number(advisorState.customBudgetMin || 0), Number(advisorState.customBudgetMax || 99999)] as const;
    return presets[advisorState.budget] ?? ([0, 99999] as const);
  }

  function rankedAdvisorResults() {
    const [min, max] = advisorBudgetRange();
    const genre = normalize(advisorState.genre);
    const artist = normalize(advisorState.artist);
    const tuning = normalize(advisorState.tuning === "Custom" ? advisorState.customTuning : advisorState.tuning);
    return advisorCatalog
      .filter(guitar => guitar.price >= min && guitar.price <= max)
      .map(guitar => {
        let score = 0;
        const artistMatch = guitar.artists.some(value => artist.includes(value) || value.includes(artist));
        const genreMatch = guitar.genres.some(value => genre.includes(value) || value.includes(genre));
        const tuningMatch = !tuning || tuning === "not sure" || guitar.tunings.includes(tuning);
        if (artistMatch) score += 70;
        if (genreMatch) score += 28;
        if (tuningMatch) score += 10;
        if (guitar.role === "Direct artist signature" && artistMatch) score += 25;
        if (guitar.role === "High-fit alternate" && genreMatch) score += 8;
        return { ...guitar, score };
      })
      .filter(guitar => guitar.score > 0)
      .sort((a, b) => b.score - a.score || a.price - b.price)
      .slice(0, 5);
  }

  function useAdvisorRecommendation(index: number) {
    const recommendation = rankedAdvisorResults()[index];
    if (!recommendation) return;
    void runSearch(recommendation.query);
  }

  const viewClass = (name: ViewName) => `page-view ${view === name ? "open" : ""}`;

  return (
    <>
      <main className="page">
        <div className="phone">
          <div className="screen">
            <div className="topbar">
              <button className="brand" onClick={goHome} type="button">
                Guitar <span>Finder</span>
              </button>
              <div className="top-actions">
                <button className="icon-btn home-icon" aria-label="Home" onClick={goHome} type="button">⌂</button>
                <button className="icon-btn" aria-label="Saved searches" onClick={showSaved} type="button">♡</button>
                <button className="icon-btn account-icon" aria-label="Account" onClick={() => currentUser ? setShowAccount(true) : openAuth("Sign in or create an account")} type="button">♙</button>
              </div>
            </div>

            <div className="content">
              <section className={viewClass("home")}>
                <div className="home-intro">
                  <h1>{uiCopy.home.headline}</h1>
                  <p>{uiCopy.home.supportingText}</p>
                  <form className="search" onSubmit={event => { event.preventDefault(); runHomeSearch(); }}>
                    <span style={{ color: "#8da1b1" }}>⌕</span>
                    <input value={homeQuery} onChange={event => setHomeQuery(event.target.value)} placeholder={uiCopy.home.searchPlaceholder} />
                    <button className="search-btn" type="submit">Search</button>
                  </form>
                  <div className="home-actions">
                    <button className="home-advisor" onClick={() => { setAdvisorState({ ...defaultAdvisor, step: 0 }); setView("advisor"); }} type="button">
                      <span><b>{uiCopy.home.advisorTitle}</b>{uiCopy.home.advisorBody}</span><span>→</span>
                    </button>
                  </div>
                </div>
                <section className="home-section">
                  <h2>Start with a search</h2>
                  <p>Try an exact model or revisit a recent search.</p>
                  <div className="quick-grid">
                    <button className="quick-card" onClick={() => quickSearch("PRS Holcomb Core Cobalt Smokeburst")} type="button"><small>Recent search</small><b>PRS Holcomb Core</b><span>Cobalt Smokeburst</span></button>
                    <button className="quick-card" onClick={() => quickSearch("Fender Custom Shop 1963 Stratocaster Sonic Blue")} type="button"><small>Example search</small><b>Fender Custom Shop '63 Strat</b><span>Sonic Blue</span></button>
                    <button className="quick-card" onClick={() => { setAdvisorState({ ...defaultAdvisor, step: 0 }); setView("advisor"); }} type="button"><small>Advisor</small><b>Help me choose</b><span>Get a few strong matches.</span></button>
                    <button className="quick-card" onClick={showSaved} type="button"><small>Saved</small><b>Saved searches</b><span>Revisit guitars and alerts.</span></button>
                  </div>
                </section>
              </section>

              <section className={viewClass("results")}>
                <div className="results-search-card">
                  <form className="results-search-row" onSubmit={event => { event.preventDefault(); runSearch(); }}>
                    <input value={finderQuery} onChange={event => setFinderQuery(event.target.value)} placeholder="Search another exact model" />
                    <button type="submit">Search</button>
                  </form>
                </div>
                <div className="results-meta">
                  <div>
                    <h2>{uiCopy.results.title}</h2>
                    <div className="sub">{webSummary}</div>
                    {!apiConfigured && <div className="sub">Search is not connected in this preview.</div>}
                    {debugEnabled && searchDiagnostics && <SearchDebug diagnostics={searchDiagnostics} />}
                  </div>
                  <div className="results-actions">
                    <button className="reset-feed" onClick={() => void runSearch(finderQuery, true)} disabled={!finderQuery.trim() || searching} type="button">{uiCopy.results.refresh}</button>
                    <button className="reset-feed" onClick={resetFeed} type="button">{uiCopy.results.reset}</button>
                    <button className="save-search-action" onClick={requestSaveSearch} type="button">{uiCopy.results.save}</button>
                  </div>
                </div>
                <div className="toolbar feed-toolbar">
                  <button className={`filter-trigger ${activeChips.length ? "active" : ""}`} onClick={openFilters} type="button">Filters{activeChips.length ? ` ${activeChips.length}` : ""}</button>
                  <button className="sort-trigger" onClick={() => setShowSortSheet(true)} type="button">Sort: {sortLabels[sortOption]} ▾</button>
                  <div className="toggle">
                    <button id="gridBtn" aria-label="Grid view" className={activeView === "grid" ? "active" : ""} onClick={() => setActiveView("grid")} type="button">▦</button>
                    <button id="listBtn" aria-label="List view" className={activeView === "list" ? "active" : ""} onClick={() => setActiveView("list")} type="button">☷</button>
                  </div>
                </div>
                {activeChips.length > 0 && <div className="active-filter-row">
                  <div className="active-filter-chips">
                    {activeChips.map(chip => <button className="active-filter-chip" key={chip.id} onClick={() => removeChip(chip.id)} type="button">{chip.label} ×</button>)}
                  </div>
                  <button className="clear-filters" onClick={clearAppliedFilters} type="button">{uiCopy.filters.clearAll}</button>
                </div>}
                <div className={activeView}>
                  {searchError ? (
                    <div className="empty search-error">{searchError}</div>
                  ) : visibleResults.length ? visibleResults.map(listing => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      listMode={activeView === "list"}
                      saved={saved.has(listing.id)}
                      compared={compare.has(listing.id)}
                      onOpenProduct={() => listing.resultType === "web" ? openListing(listing.id) : openProduct(listing.id)}
                      onOpenListing={() => openListing(listing.id)}
                      onSave={() => toggleSave(listing.id)}
                      onCompare={() => toggleCompare(listing.id)}
                    />
                  )) : (
                    <div className="empty">{searching ? uiCopy.results.loading : <><b>{uiCopy.emptyStates.noExactMatchesTitle}</b><br />{uiCopy.emptyStates.noExactMatchesBody}</>}</div>
                  )}
                </div>
                {exactResults.length > 0 && <div className="load-more-wrap">
                  {hasMoreResults ? (
                    <button className="load-more-btn" onClick={() => void loadMoreResults()} disabled={loadingMore} type="button">
                      {loadingMore ? uiCopy.results.loadingMore : uiCopy.results.loadMore}
                    </button>
                  ) : resultsExhausted ? (
                    <div className="end-of-results">{uiCopy.results.reachedEnd}</div>
                  ) : null}
                </div>}
                <PlatformShortcuts links={platformLinks} query={finderQuery} />
                <div className="footer">We only show listings that look like the exact guitar. Open the seller page before buying.</div>
              </section>

              <section className={viewClass("saved")}>
                <SavedView
                  currentUser={currentUser}
                  savedSearches={savedSearches}
                  savedListings={[...exactResults, ...listings].filter(listing => saved.has(listing.id))}
                  onAuth={() => openAuth("Sign in to view saved searches", showSaved)}
                  onGoHome={goHome}
                  onRunSaved={runSavedSearch}
                  onEditAlert={openAlertSettings}
                  onRemoveSearch={index => setSavedSearches(previous => previous.filter((_, itemIndex) => itemIndex !== index))}
                  onOpenListing={id => openListing(id)}
                  onRemoveListing={toggleSave}
                />
              </section>

              <section className={viewClass("product")}>
                <ProductView
                  listing={productListing}
                  related={exactResults.filter(item => normalize(item.model) === normalize(productListing.model) && normalize(item.finish) === normalize(productListing.finish))}
                  saved={saved}
                  compare={compare}
                  onBack={() => setView("results")}
                  onOpenListing={id => openListing(id)}
                  onSave={toggleSave}
                  onCompare={toggleCompare}
                />
              </section>

              <section className={`${viewClass("listing")} ${listingDirection ? `listing-transition-${listingDirection}` : ""}`}>
                <ListingDetail
                  listing={currentListing}
                  gallery={currentGallery}
                  galleryIndex={galleryIndex}
                  index={listingIndex}
                  count={listingItems.length}
                  showBreakdown={showBreakdown}
                  hasPrev={listingIndex > 0}
                  hasNext={listingIndex < listingItems.length - 1}
                  onBack={() => setView("results")}
                  onPrev={() => openAdjacentListing(-1)}
                  onNext={() => openAdjacentListing(1)}
                  onGallery={setGalleryIndex}
                  onGalleryStep={stepGallery}
                  onToggleBreakdown={() => setShowBreakdown(value => !value)}
                  onCompare={() => toggleCompare(currentListing.id)}
                />
              </section>

              <section className={viewClass("advisor")}>
                <AdvisorView
                  state={advisorState}
                  setState={setAdvisorState}
                  results={rankedAdvisorResults()}
                  budgetRange={advisorBudgetRange()}
                  onBack={() => advisorState.step > 0 ? setAdvisorState(previous => ({ ...previous, step: previous.step - 1 })) : setView("results")}
                  onUseRecommendation={useAdvisorRecommendation}
                />
              </section>
            </div>

            <BottomNav view={view} onHome={goHome} onFinder={() => setView("home")} onAdvisor={() => { setAdvisorState({ ...defaultAdvisor, step: 0 }); setView("advisor"); }} onSaved={showSaved} />
          </div>
        </div>
      </main>

      <CompareTray count={comparedListings.length} onOpen={() => setShowCompare(true)} />
      {showFilterSheet && (
        <FilterSheet
          filters={draftFilters}
          resultCount={draftResultCount}
          onChange={setDraftFilters}
          onApply={applyFilters}
          onClear={() => setDraftFilters(clearFeedFilters())}
          onClose={() => setShowFilterSheet(false)}
        />
      )}
      {showSortSheet && (
        <SortSheet
          value={sortOption}
          onChange={value => {
            setSortOption(value);
            setShowSortSheet(false);
          }}
          onClose={() => setShowSortSheet(false)}
        />
      )}
      {authTitle && (
        <AuthSheet
          title={authTitle}
          email={authEmail}
          onEmailChange={setAuthEmail}
          onClose={() => { setAuthTitle(null); afterAuthRef.current = null; }}
          onSocial={finishLogin}
          onEmail={() => authEmail.includes("@") && finishLogin(authEmail, "Email")}
        />
      )}
      {pendingAlertQuery && (
        <AlertSheet
          query={pendingAlertQuery}
          condition={alertCondition}
          frequency={alertFrequency}
          targetPrice={alertTargetPrice}
          international={alertInternational}
          onClose={() => setPendingAlertQuery(null)}
          onCondition={setAlertCondition}
          onFrequency={setAlertFrequency}
          onTargetPrice={setAlertTargetPrice}
          onInternational={() => setAlertInternational(value => !value)}
          onSave={saveAlert}
        />
      )}
      {showAccount && currentUser && <AccountSheet user={currentUser} onClose={() => setShowAccount(false)} onSaved={() => { setShowAccount(false); showSaved(); }} onSignOut={signOut} />}
      {showCompare && <CompareSheet listings={comparedListings} onClose={() => setShowCompare(false)} />}
    </>
  );
}

function SearchDebug({ diagnostics }: { diagnostics: SearchDiagnostics }) {
  const reasons = Object.entries(diagnostics.rejectionReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([reason, count]) => `${reason}: ${count}`)
    .join(" · ");

  return (
    <div className="search-debug">
      <div>Results checked: {diagnostics.rawCandidateCount}</div>
      <div>Matches kept: {diagnostics.qualifiedCount}</div>
      <div>Set aside: {diagnostics.rejectedCount}</div>
      <div>Search errors: {diagnostics.apiErrors.length}</div>
      <div>Details checked: {diagnostics.metadataFetchAttempts ?? 0}</div>
      <div>Prices found: {(diagnostics.jsonLdOfferPricesExtracted ?? 0) + (diagnostics.searchRichResultPricesExtracted ?? 0)}</div>
      {reasons && <div className="debug-reasons">{reasons}</div>}
    </div>
  );
}

function ListingCard({ listing, listMode, saved, compared, onOpenProduct, onOpenListing, onSave, onCompare }: {
  listing: Listing;
  listMode: boolean;
  saved: boolean;
  compared: boolean;
  onOpenProduct: () => void;
  onOpenListing: () => void;
  onSave: () => void;
  onCompare: () => void;
}) {
  if (listMode) {
    return (
      <ListingListCard
        listing={listing}
        saved={saved}
        compared={compared}
        onOpenProduct={onOpenProduct}
        onOpenListing={onOpenListing}
        onSave={onSave}
        onCompare={onCompare}
      />
    );
  }

  const isWebResult = listing.resultType === "web";
  const feed = toUnifiedFeedListing(listing);
  const itemPriceText = feed.itemPrice !== undefined ? money(feed.itemPrice) : listing.possiblePrice;
  const totalText = feed.totalEstimatedCost !== undefined && feed.totalCostComplete ? `${money(feed.totalEstimatedCost)} total estimated cost` : undefined;
  const conditionText = feed.condition ? feed.condition.replace("-", " ") : listing.resultType === "web" ? undefined : listing.condition;
  const metaText = isWebResult ? conditionText : [listing.finish, conditionText].filter(Boolean).join(" · ");
  const context = buyingContext(listing);
  return (
    <article className="card">
      <div
        className="card-main"
        role="button"
        tabIndex={0}
        onClick={onOpenProduct}
        onKeyDown={event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenProduct();
          }
        }}
      >
        <div className="image">
          <ListingImageView images={imageCandidatesForListing(listing)} listing={listing} />
          <ImageActions saved={saved} compared={compared} onSave={onSave} onCompare={onCompare} />
        </div>
        <div className="body">
          <div className="retailer">{listing.source}</div>
          <div className="title">{listing.title}</div>
          {metaText && <div className="meta">{metaText}</div>}
          <div className={itemPriceText ? "price" : "price price-muted"}>{itemPriceText || uiCopy.listing.priceOnSource} {itemPriceText && <small>item price</small>}</div>
          {totalText && <div className="card-total">{totalText}</div>}
          {context && <div className="seller-row"><span>{context}</span></div>}
          <div className="card-freshness"><span>{availabilityLine(listing)}</span></div>
        </div>
      </div>
      <div className="card-actions"><button className="direct" onClick={onOpenListing} type="button">View listing</button></div>
    </article>
  );
}

function ListingListCard({ listing, saved, compared, onOpenProduct, onOpenListing, onSave, onCompare }: {
  listing: Listing;
  saved: boolean;
  compared: boolean;
  onOpenProduct: () => void;
  onOpenListing: () => void;
  onSave: () => void;
  onCompare: () => void;
}) {
  const feed = toUnifiedFeedListing(listing);
  const itemPriceText = feed.itemPrice !== undefined ? money(feed.itemPrice) : listing.possiblePrice;
  const totalPriceText = feed.totalEstimatedCost !== undefined && feed.totalCostComplete ? money(feed.totalEstimatedCost) : undefined;
  const priceText = itemPriceText || totalPriceText || uiCopy.listing.priceOnSource;
  const conditionText = feed.condition ? feed.condition.replace("-", " ") : listing.resultType === "web" ? undefined : listing.condition;
  const sourceType = normalizedSourceType(listing).replace("-", " ");
  const meta = [listing.resultType === "web" ? undefined : listing.finish, conditionText].filter(Boolean).join(" · ");
  const location = buyingContext(listing);

  return (
    <article className="card list-card compact-list-card">
      <div
        className="list-card-main"
        role="button"
        tabIndex={0}
        onClick={onOpenProduct}
        onKeyDown={event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpenProduct();
          }
        }}
      >
        <div className="list-image image">
          <ListingImageView images={imageCandidatesForListing(listing)} listing={listing} />
          <ImageActions saved={saved} compared={compared} onSave={onSave} onCompare={onCompare} />
        </div>
        <div className="list-body">
          <div className="retailer">{listing.source}</div>
          <div className="list-title">{listing.title}</div>
          {meta && <div className="list-meta">{meta}</div>}
          <div className={itemPriceText || totalPriceText ? "list-price" : "list-price muted"}>{priceText}</div>
          {location && <div className="list-meta">{location} · {sourceType}</div>}
          <div className="list-status">{availabilityLine(listing)}</div>
          <button className="list-direct" onClick={event => { event.stopPropagation(); onOpenListing(); }} type="button">View listing</button>
        </div>
      </div>
    </article>
  );
}

function SourcePlaceholder({ listing }: { listing: Listing }) {
  return <div className="source-placeholder"><b>{listing.logoText || listing.source.slice(0, 2).toUpperCase()}</b><span>{listing.source}</span></div>;
}

function ListingImageView({ images, image, listing }: { images?: ListingImageData[]; image?: ListingImageData; listing: Listing }) {
  const candidates = images?.length ? images : image ? [image] : [];
  const candidateKey = candidates.map(candidate => candidate.url).join("|");
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [candidateKey]);
  const current = candidates[index];
  const url = safeImageUrl(current?.url);
  if (!url) return <SourcePlaceholder listing={listing} />;
  return (
    <img
      className={current?.fit === "contain" ? "fit-contain" : undefined}
      src={url}
      alt={current?.alt || listing.title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (process.env.NODE_ENV !== "production") {
          console.info("Listing image replaced with placeholder", {
            sourceName: listing.source,
            imageUrl: url,
            failureReason: "browser-load-failed"
          });
        }
        setIndex(currentIndex => currentIndex + 1);
      }}
    />
  );
}

function ImageActions({ saved, compared, onSave, onCompare }: { saved: boolean; compared: boolean; onSave: () => void; onCompare: () => void }) {
  return (
    <div className="image-actions">
      <button className={`image-action ${saved ? "active" : ""}`} onClick={event => { event.stopPropagation(); onSave(); }} type="button">♡</button>
      <button className={`image-action ${compared ? "active" : ""}`} onClick={event => { event.stopPropagation(); onCompare(); }} type="button">⊞</button>
    </div>
  );
}

function TagList({ tags, count = 2 }: { tags: string[]; count?: number }) {
  return <div className="tags">{tags.slice(0, count).map(tag => <span className={`tag ${tagTone(tag)}`} key={tag}>{tag}</span>)}</div>;
}

function PlatformShortcuts({ links, query }: { links: PlatformShortcut[]; query: string }) {
  const fallbackLinks = query.trim()
    ? [
        { name: "Facebook Marketplace", url: `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}` },
        { name: "Craigslist", url: `https://www.craigslist.org/search/sss?query=${encodeURIComponent(query)}` },
        { name: "The Gear Page Guitar Emporium", url: `https://www.thegearpage.net/board/index.php?search/search&keywords=${encodeURIComponent(query)}` },
        { name: "Reverb", url: `https://reverb.com/marketplace?query=${encodeURIComponent(query)}` },
        { name: "eBay", url: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}` },
        { name: "Google", url: `https://www.google.com/search?q=${encodeURIComponent(query)}` }
      ]
    : [];
  const visibleLinks = links.length ? links : fallbackLinks;

  if (!visibleLinks.length) return null;

  return (
    <section className="platform-fallback">
      <h2>{uiCopy.fallback.title}</h2>
      <p>{uiCopy.fallback.helperText}</p>
      <div className="platform-links">
        {visibleLinks.map(link => (
          <a className="platform-link" href={link.url} target="_blank" rel="noreferrer" key={link.name}>
            {link.name === "The Gear Page Guitar Emporium" ? "The Gear Page" : link.name}
          </a>
        ))}
      </div>
    </section>
  );
}

function ProductView({ listing, related, saved, compare, onBack, onOpenListing, onSave, onCompare }: {
  listing: Listing;
  related: Listing[];
  saved: Set<string>;
  compare: Set<string>;
  onBack: () => void;
  onOpenListing: (id: string) => void;
  onSave: (id: string) => void;
  onCompare: (id: string) => void;
}) {
  const visibleRelated = related.length ? related : [listing];
  return (
    <>
      <div className="page-head"><button className="back" onClick={onBack} type="button">‹</button><div><div className="sub">Guitar</div><b>{listing.title}</b></div></div>
      <section className="product-hero">
        <ListingImageView images={imageCandidatesForListing(listing)} listing={listing} />
        <div className="pad">
          <h2>{listing.title}</h2>
          <p>{listing.finish}. Compare matching listings before leaving the app.</p>
          <TagList tags={listing.tags} count={3} />
        </div>
      </section>
      <div className="section-head"><div><h2>Matching listings</h2><div className="sub">{visibleRelated.length} available now</div></div></div>
      <div className="list">
        {visibleRelated.map(item => {
          const isWebResult = item.resultType === "web";
          const feed = toUnifiedFeedListing(item);
          const itemPriceText = feed.itemPrice !== undefined ? money(feed.itemPrice) : item.possiblePrice;
          const meta = isWebResult
            ? [visibleCondition(item), item.possibleLocation].filter(Boolean).join(" · ")
            : [item.condition, item.country].filter(Boolean).join(" · ");
          return (
            <article className="card list-card" key={item.id}>
              <div className="image"><ListingImageView images={imageCandidatesForListing(item)} listing={item} /><ImageActions saved={saved.has(item.id)} compared={compare.has(item.id)} onSave={() => onSave(item.id)} onCompare={() => onCompare(item.id)} /></div>
              <div className="body">
                <div className="retailer">{item.source}</div>
                <div className="title">{item.title}</div>
                {meta && <div className="meta">{meta}</div>}
                <div className={itemPriceText ? "price" : "price price-muted"}>{itemPriceText || uiCopy.listing.priceOnSource} {!isWebResult && <small>est. total</small>}</div>
                {isWebResult ? <div className="breakdown">{availabilityLine(item)}</div> : <div className="breakdown">Item {money(item.item)} · Shipping {money(item.shipping)}</div>}
                <button className="direct" style={{ marginTop: 9, width: "100%" }} onClick={() => onOpenListing(item.id)} type="button">View listing</button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function ListingDetail({ listing, gallery, galleryIndex, index, count, showBreakdown, hasPrev, hasNext, onBack, onPrev, onNext, onGallery, onGalleryStep, onToggleBreakdown, onCompare }: {
  listing: Listing;
  gallery: ListingImageData[];
  galleryIndex: number;
  index: number;
  count: number;
  showBreakdown: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGallery: (index: number) => void;
  onGalleryStep: (direction: -1 | 1) => void;
  onToggleBreakdown: () => void;
  onCompare: () => void;
}) {
  const isWebResult = listing.resultType === "web";
  const conditionLabel = visibleCondition(listing);
  const subtitle = listingDetailSubtitle(listing);
  const webAvailability = availabilityLine(listing);
  return (
    <>
      <div className="listing-toolbar">
        <button className="back-results" onClick={onBack} type="button">← {uiCopy.listing.backToResults}</button>
        <div className="pager">
          <button className="pager-btn" disabled={!hasPrev} onClick={onPrev} type="button">‹</button>
          <div className="pager-count">{index + 1} of {count}</div>
          <button className="pager-btn" disabled={!hasNext} onClick={onNext} type="button">›</button>
        </div>
        <div className="toolbar-spacer" />
      </div>
      <section className="product-hero">
        <div className="pad">
          <div className="retailer">{listing.source}</div>
          <div className="product-title-row">
            <div><h2 style={{ marginTop: 6 }}>{listing.title}</h2>{subtitle && <p>{subtitle}</p>}</div>
            {conditionLabel && <span className="condition-pill">{conditionLabel}</span>}
          </div>
        </div>
      </section>
      <div className="gallery-wrap">
        <div className="gallery-main">
          <ListingImageView image={gallery[galleryIndex]} listing={listing} />
          {gallery.length > 1 && <button className="gallery-arrow prev" onClick={() => onGalleryStep(-1)} type="button">‹</button>}
          {gallery.length > 1 && <button className="gallery-arrow next" onClick={() => onGalleryStep(1)} type="button">›</button>}
          {gallery.length > 0 && <div className="gallery-counter">{galleryIndex + 1} / {gallery.length}</div>}
        </div>
        {gallery.length > 1 && <div className="gallery">
          {gallery.map((image, itemIndex) => (
            <button className={`thumb ${itemIndex === galleryIndex ? "active" : ""}`} onClick={() => onGallery(itemIndex)} type="button" key={image.url || `${listing.id}-${itemIndex}`}>
              <ListingImageView image={image} listing={listing} />
            </button>
          ))}
        </div>}
      </div>
      {isWebResult ? (
        <div className="checkout-card">
          <div className="checkout-kicker">Listing price</div>
          <div className="checkout-main">
            <div>
              <div className={listing.possiblePrice ? "checkout-total" : "checkout-total checkout-total-muted"}>{listing.possiblePrice || uiCopy.listing.priceOnSource}</div>
              <div className="checkout-note">{webAvailability}</div>
            </div>
          </div>
          <a className="checkout-cta" href={listing.url} target="_blank" rel="noreferrer">{uiCopy.listing.openOriginal}</a>
          {listing.possibleLocation && <div className="checkout-secondary"><span>{listing.possibleLocation}</span></div>}
        </div>
      ) : (
        <div className="checkout-card">
          <div className="checkout-kicker">{uiCopy.listing.totalEstimatedCost}</div>
          <div className="checkout-main">
            <div>
              <div className="checkout-total">{money(listing.total)}</div>
              <div className="checkout-note">Includes instrument, shipping, estimated tax{listing.import > 0 ? ", and import duty" : ""}.</div>
            </div>
            <button className="cost-toggle" onClick={onToggleBreakdown} type="button"><span>{showBreakdown ? "Hide breakdown" : uiCopy.listing.costBreakdown}</span><span className="chev">{showBreakdown ? "▴" : "▾"}</span></button>
          </div>
          <div className={`inline-breakdown ${showBreakdown ? "" : "collapsed"}`}>
            <ReceiptRows listing={listing} />
          </div>
          <a className="checkout-cta" href={listing.url} target="_blank" rel="noreferrer">Open on {listing.source}</a>
          <div className="checkout-secondary"><span>{listing.location} · {listing.freshness}</span></div>
        </div>
      )}
      <InfoSections listing={listing} onCompare={onCompare} />
    </>
  );
}

function ReceiptRows({ listing }: { listing: Listing }) {
  return (
    <>
      <div className="receipt-row"><span>Instrument price</span><span>{money(listing.item)}</span></div>
      <div className="receipt-row"><span>Shipping</span><span>{money(listing.shipping)}</span></div>
      <div className="receipt-row"><span>Estimated sales tax</span><span>{money(listing.tax)}</span></div>
      <div className={`receipt-row ${listing.import > 0 ? "" : "muted"}`}><span>Estimated import duty</span><span>{money(listing.import)}</span></div>
      <div className="receipt-row total"><span>Total estimated cost</span><span>{money(listing.total)}</span></div>
    </>
  );
}

function InfoSections({ listing, onCompare }: { listing: Listing; onCompare: () => void }) {
  if (listing.resultType === "web") {
    const conditionLabel = visibleCondition(listing);
    const sourceNotes = sanitizeSourceText(listing.snippet || listing.retailerDescription);
    return (
      <>
        <div className="priority-section">
          <div className="section-head"><div><h2>{uiCopy.listing.aboutListing}</h2></div></div>
          <div className="scrape-card">
            <div className="scrape-grid">
              <div className="scrape-item"><small>Shop</small><b>{listing.source}</b></div>
              {listing.seller && listing.seller !== listing.source && <div className="scrape-item"><small>Seller</small><b>{listing.seller}</b></div>}
              {listing.possibleLocation && <div className="scrape-item"><small>Location</small><b>{listing.possibleLocation}</b></div>}
              {conditionLabel && <div className="scrape-item"><small>Condition</small><b>{conditionLabel}</b></div>}
              <div className="scrape-item"><small>Availability</small><b>{availabilityLine(listing)}</b></div>
              {listing.possiblePrice && <div className="scrape-item"><small>Price</small><b>{listing.possiblePrice}</b></div>}
            </div>
            {sourceNotes && <div className="scrape-notes"><b>Source notes</b><br />{sourceNotes}</div>}
          </div>
          <button className="cta-secondary" onClick={onCompare} type="button">{uiCopy.listing.addToCompare}</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="priority-section">
        <div className="section-head"><div><h2>{uiCopy.listing.listingDetails}</h2></div></div>
        <div className="scrape-card">
          <div className="scrape-grid">
            <div className="scrape-item"><small>Condition</small><b>{listing.condition}</b></div>
            <div className="scrape-item"><small>Weight</small><b>{listing.weight || "Not listed"}</b></div>
            <div className="scrape-item"><small>Year</small><b>{listing.year || "Not listed"}</b></div>
            <div className="scrape-item"><small>Included</small><b>{listing.included || "Not listed"}</b></div>
          </div>
          <div className="scrape-notes"><b>Seller notes</b><br />{listing.conditionNotes || listing.description}</div>
        </div>
      </div>
      <div className="priority-section">
        <div className="section-head"><div><h2>{uiCopy.listing.purchaseDetails}</h2></div></div>
        <div className="info-grid">
          <div className="info"><small>Returns</small><b>{listing.returns}</b></div>
          <div className="info"><small>Financing</small><b>{listing.financing}</b></div>
          <div className="info"><small>Source type</small><b>{listing.sourceType}</b></div>
          <div className="info"><small>Last checked</small><b>{listing.freshness}</b></div>
        </div>
      </div>
      <div className="priority-section">
        <div className="section-head"><div><h2>{uiCopy.listing.aboutListing}</h2></div></div>
        <div className="shop-card"><div className="shop-logo">{listing.logoText || listing.source.slice(0, 2).toUpperCase()}</div><div><b>{listing.source}</b><span>{listing.sourceType} · {listing.location}</span></div></div>
        <div className="empty" style={{ marginTop: 10 }}>{listing.retailerDescription || listing.description}</div>
        {(listing.sourceType.includes("Forum") || listing.sourceType.includes("Local")) && <div className="notice">Private-sale listing: inspect the guitar carefully, verify the seller, and use safe payment and meetup practices.</div>}
        <button className="cta-secondary" onClick={onCompare} type="button">{uiCopy.listing.addToCompare}</button>
      </div>
    </>
  );
}

function AdvisorView({ state, setState, results, budgetRange, onBack, onUseRecommendation }: {
  state: AdvisorState;
  setState: Dispatch<SetStateAction<AdvisorState>>;
  results: (AdvisorGuitar & { score: number })[];
  budgetRange: readonly [number, number];
  onBack: () => void;
  onUseRecommendation: (index: number) => void;
}) {
  const step = advisorSteps[state.step];
  const stepLabels = ["Budget", "Style", "Inspo", "Tuning", "Used"];
  const update = (patch: Partial<AdvisorState>) => setState(previous => ({ ...previous, ...patch }));
  const next = () => setState(previous => ({ ...previous, step: Math.min(previous.step + 1, advisorSteps.length - 1) }));
  const goTo = (stepIndex: number) => setState(previous => ({ ...previous, step: Math.max(0, Math.min(stepIndex, advisorSteps.length - 1)) }));
  return (
    <>
      <div className="page-head"><button className="back" onClick={onBack} type="button">‹</button><div><div className="sub">Advisor</div><b>Find your guitar</b></div></div>
      <div className="advisor-shell">
        <div className="advisor-cover">
          <h2>{uiCopy.advisor.title}</h2>
          <p>{uiCopy.advisor.body}</p>
          <div className="advisor-stepper">
            {stepLabels.map((_, index) => <button className={index === state.step ? "active" : index < state.step ? "done" : ""} onClick={() => goTo(index)} key={index} type="button">{index + 1}</button>)}
          </div>
        </div>
        <div className="advisor-body">
          {step === "budget" && <AdvisorBudget state={state} update={update} />}
          {step === "genre" && <AdvisorGenre state={state} update={update} />}
          {step === "artist" && <><div className="advisor-label">Step 3</div><div className="advisor-question">{uiCopy.advisor.artistQuestion}</div><input className="advisor-input" value={state.artist} onChange={event => update({ artist: event.target.value })} placeholder="Favorite artist or band" /><div className="helper">Examples: Misha Mansoor, Brad Paisley, August Burns Red, John Mayer.</div></>}
          {step === "tuning" && <AdvisorTuning state={state} update={update} />}
          {step === "used" && <><div className="advisor-label">Step 5</div><div className="advisor-question">{uiCopy.advisor.usedQuestion}</div><div className="choice-grid">{["Yes", "Maybe", "No"].map(value => <button className={`choice ${state.used === value ? "active" : ""}`} onClick={() => update({ used: value })} key={value} type="button">{value}</button>)}</div></>}
          {step === "result" && <AdvisorResults state={state} results={results} budgetRange={budgetRange} onUseRecommendation={onUseRecommendation} onEdit={() => update({ step: 0 })} />}
          {step !== "result" && <div className="advisor-actions"><button className="advisor-back" onClick={onBack} type="button">Back</button><button className="advisor-next" onClick={next} type="button">Next</button></div>}
        </div>
      </div>
    </>
  );
}

function AdvisorBudget({ state, update }: { state: AdvisorState; update: (patch: Partial<AdvisorState>) => void }) {
  const options = ["Under $1,000", "$1,000-$1,500", "$1,500-$3,000", "$3,000-$5,000", "$5,000+", "Custom range"];
  return (
    <>
      <div className="advisor-label">Step 1</div><div className="advisor-question">What is your budget?</div>
      <div className="choice-grid">{options.map(value => <button className={`choice ${state.budget === value ? "active" : ""}`} onClick={() => update({ budget: value })} key={value} type="button">{value}</button>)}</div>
      {state.budget === "Custom range" && <div className="custom-budget"><label>Minimum<input type="number" placeholder="$500" value={state.customBudgetMin} onChange={event => update({ customBudgetMin: event.target.value })} /></label><label>Maximum<input type="number" placeholder="$2,500" value={state.customBudgetMax} onChange={event => update({ customBudgetMax: event.target.value })} /></label></div>}
    </>
  );
}

function AdvisorGenre({ state, update }: { state: AdvisorState; update: (patch: Partial<AdvisorState>) => void }) {
  const genres = ["Country", "Bluegrass", "Blues", "Classic rock", "Modern rock", "Hair metal", "Metalcore", "Djent", "Progressive metal", "Funk", "Indie", "Shoegaze", "Punk", "Jazz", "Pop", "Worship", "R&B / Soul"];
  return <><div className="advisor-label">Step 2</div><div className="advisor-question">{uiCopy.advisor.genreQuestion}</div><div className="choice-grid">{genres.map(value => <button className={`choice ${state.genre === value ? "active" : ""}`} onClick={() => update({ genre: value })} key={value} type="button">{value}</button>)}</div><div className="helper">Pick the closest primary style. Artist inspiration helps narrow things down.</div></>;
}

function AdvisorTuning({ state, update }: { state: AdvisorState; update: (patch: Partial<AdvisorState>) => void }) {
  const tunings = ["Standard", "Eb", "Drop D", "Drop C", "Drop B", "Drop A", "Drop G#", "Not sure", "Custom"];
  return <><div className="advisor-label">Step 4</div><div className="advisor-question">{uiCopy.advisor.tuningQuestion}</div><div className="choice-grid">{tunings.map(value => <button className={`choice ${state.tuning === value ? "active" : ""}`} onClick={() => update({ tuning: value })} key={value} type="button">{value}</button>)}</div>{state.tuning === "Custom" && <input className="advisor-input" value={state.customTuning} onChange={event => update({ customTuning: event.target.value })} placeholder="e.g. DADGAD, C# standard, open G" />}</>;
}

function AdvisorResults({ state, results, budgetRange, onUseRecommendation, onEdit }: {
  state: AdvisorState;
  results: (AdvisorGuitar & { score: number })[];
  budgetRange: readonly [number, number];
  onUseRecommendation: (index: number) => void;
  onEdit: () => void;
}) {
  const [min, max] = budgetRange;
  return (
    <>
      <div className="advisor-label">Matches</div><div className="advisor-question">{uiCopy.advisor.resultsTitle}</div>
      <div className="advisor-summary"><b>Your answers:</b> {state.genre} · {state.artist || "No artist"} · {state.tuning === "Custom" ? state.customTuning || "Custom tuning" : state.tuning} · {max > 90000 ? `${money(min)}+` : `${money(min)}-${money(max)}`}</div>
      {results.length ? <div className="result-list">{results.map((recommendation, index) => <div className={`result-card ${index === 0 ? "best" : ""}`} key={recommendation.name}><div className="result-card-top"><div><div className="result-label">{index === 0 ? "Best match" : recommendation.role}</div><h3>{recommendation.name}</h3></div><div className="result-price">{money(recommendation.price)}</div></div><p>{recommendation.why}</p><div className="result-tags">{recommendation.tags.map(tag => <span className="result-tag" key={tag}>{tag}</span>)}</div><button className="recommendation-cta" onClick={() => onUseRecommendation(index)} type="button"><span>{uiCopy.advisor.seeListingsForGuitar}</span><span>→</span></button></div>)}</div> : <div className="empty" style={{ marginTop: 12 }}>Nothing strong inside that budget yet. Edit your answers or widen the budget range.</div>}
      <button className="edit-answers" onClick={onEdit} type="button">← {uiCopy.advisor.editAnswers}</button>
    </>
  );
}

function SavedView({ currentUser, savedSearches, savedListings, onAuth, onGoHome, onRunSaved, onEditAlert, onRemoveSearch, onOpenListing, onRemoveListing }: {
  currentUser: User | null;
  savedSearches: SavedSearch[];
  savedListings: Listing[];
  onAuth: () => void;
  onGoHome: () => void;
  onRunSaved: (item: SavedSearch) => void;
  onEditAlert: (query: string) => void;
  onRemoveSearch: (index: number) => void;
  onOpenListing: (id: string) => void;
  onRemoveListing: (id: string) => void;
}) {
  if (!currentUser) return <div className="saved-placeholder"><h2>Saved searches</h2><p>{uiCopy.account.savedIntro}</p><button className="recommendation-cta" style={{ marginTop: 14 }} onClick={onAuth} type="button"><span>Sign in to save this</span><span>→</span></button></div>;
  return (
    <>
      <div className="saved-placeholder"><h2>Saved</h2><p>Track searches for new listings and price drops, or revisit individual listings you saved.</p><button className="recommendation-cta" style={{ marginTop: 14 }} onClick={onGoHome} type="button"><span>Start a new search</span><span>→</span></button></div>
      {savedSearches.length > 0 && <section className="home-section"><h2>Search alerts</h2><p>{savedSearches.length} active alert{savedSearches.length === 1 ? "" : "s"}</p><div className="saved-list">{savedSearches.map((item, index) => <div className="saved-card" key={item.query}><div className="saved-card-top"><div><div className="saved-label">Saved search</div><h3>{item.query}</h3></div><button className="image-action" onClick={() => onRemoveSearch(index)} type="button">×</button></div><p>{item.condition === "both" ? "New and used" : item.condition === "new" ? "New only" : "Used only"} · {item.includeInternational ? "Worldwide" : "US only"} · {item.frequency === "instant" ? "Instant alerts" : item.frequency === "daily" ? "Daily digest" : "Weekly digest"} · Sort: {sortLabels[item.sort]}{item.targetPrice ? ` · Under ${money(item.targetPrice)}` : ""}</p><div className="saved-card-actions"><button className="saved-primary" onClick={() => onRunSaved(item)} type="button">View results</button><button className="saved-secondary" onClick={() => onEditAlert(item.query)} type="button">Edit alert</button></div></div>)}</div></section>}
      {savedListings.length > 0 && <section className="home-section"><h2>Saved listings</h2><p>{savedListings.length} listing{savedListings.length === 1 ? "" : "s"} saved</p><div className="saved-list">{savedListings.map(item => {
        const details = [item.source, visibleCondition(item), item.resultType === "web" ? item.possiblePrice || uiCopy.listing.priceOnSource : `${money(item.total)} estimated total`].filter(Boolean).join(" · ");
        return <div className="saved-card" key={item.id}><div className="saved-label">Saved listing</div><h3>{item.title}</h3><p>{details}</p><div className="saved-card-actions"><button className="saved-primary" onClick={() => onOpenListing(item.id)} type="button">View listing</button><button className="saved-secondary" onClick={() => onRemoveListing(item.id)} type="button">Remove</button></div></div>;
      })}</div></section>}
      {!savedSearches.length && !savedListings.length && <section className="home-section"><div className="empty">Nothing saved yet. Search for a guitar and tap Save search when you want us to keep an eye out.</div></section>}
    </>
  );
}

function BottomNav({ view, onHome, onFinder, onAdvisor, onSaved }: { view: ViewName; onHome: () => void; onFinder: () => void; onAdvisor: () => void; onSaved: () => void }) {
  return <div className="bottom-nav"><button className={view === "home" ? "active" : ""} onClick={onHome} type="button"><span>⌂</span><span>Home</span></button><button className={view === "results" ? "active" : ""} onClick={onFinder} type="button"><span>⌕</span><span>Finder</span></button><button className={view === "advisor" ? "active" : ""} onClick={onAdvisor} type="button"><span>◎</span><span>Advisor</span></button><button className={view === "saved" ? "active" : ""} onClick={onSaved} type="button"><span>♡</span><span>Saved</span></button></div>;
}

function CompareTray({ count, onOpen }: { count: number; onOpen: () => void }) {
  return <div className={`compare-tray ${count ? "open" : ""}`}><div><b>{count} listing{count === 1 ? "" : "s"} selected</b><br /><span>Compare price, condition, and source</span></div><button className="compare-btn" onClick={onOpen} type="button">Compare</button></div>;
}

function FilterSheet({ filters, resultCount, onChange, onApply, onClear, onClose }: {
  filters: FeedFilters;
  resultCount: number;
  onChange: Dispatch<SetStateAction<FeedFilters>>;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const locationReady = Boolean(filters.searchLocation?.latitude && filters.searchLocation.longitude);
  const update = (patch: Partial<FeedFilters>) => onChange(previous => ({ ...previous, ...patch }));
  const updateNumber = (key: "priceMin" | "priceMax", value: string) => update({ [key]: value ? Number(value) : undefined });
  const toggleCondition = (condition: ListingCondition) => onChange(previous => ({
    ...previous,
    conditions: previous.conditions.includes(condition) ? previous.conditions.filter(value => value !== condition) : [...previous.conditions, condition]
  }));
  const toggleType = (sourceType: ListingSourceType) => onChange(previous => ({
    ...previous,
    listingTypes: previous.listingTypes.includes(sourceType) ? previous.listingTypes.filter(value => value !== sourceType) : [...previous.listingTypes, sourceType]
  }));
  const conditionOptions: [ListingCondition, string][] = [["new", "New"], ["mint", "Mint"], ["excellent", "Excellent"], ["very-good", "Very good"], ["good", "Good"]];
  const typeOptions: [ListingSourceType, string][] = [["retailer", "Retailer"], ["boutique", "Boutique shop"], ["marketplace", "Marketplace"], ["local-classified", "Local classifieds"], ["forum-classified", "Forum classifieds"], ["international-retailer", "International retailer"]];

  return (
    <div className="overlay open" onClick={event => event.currentTarget === event.target && onClose()}>
      <div className="sheet filter-sheet">
        <div className="sheet-head sticky-sheet-head">
          <div><h2>{uiCopy.filters.title}</h2><p>Narrow the results to the guitars you’d actually consider.</p></div>
          <div className="sheet-head-actions"><button className="clear-filters" onClick={onClear} type="button">{uiCopy.filters.clearAll}</button><button className="close" onClick={onClose} type="button">×</button></div>
        </div>
        <div className="filter-body">
          <section className="filter-section">
            <h3>Price</h3>
            <div className="filter-input-grid">
              <label>Minimum<input inputMode="numeric" value={filters.priceMin ?? ""} onChange={event => updateNumber("priceMin", event.target.value)} placeholder="$____" /></label>
              <label>Maximum<input inputMode="numeric" value={filters.priceMax ?? ""} onChange={event => updateNumber("priceMax", event.target.value)} placeholder="$____" /></label>
            </div>
            <div className="filter-subhead">Filter by:</div>
            <RadioRow checked={filters.priceMode === "total"} label="Total estimated cost" onClick={() => update({ priceMode: "total" })} />
            <RadioRow checked={filters.priceMode === "item"} label="Item price only" onClick={() => update({ priceMode: "item" })} />
            <CheckboxRow checked={filters.includeIncompleteCost} label="Include listings without full cost" onClick={() => update({ includeIncompleteCost: !filters.includeIncompleteCost })} />
          </section>

          <section className="filter-section">
            <h3>Distance</h3>
            {(["any", "25", "50", "100", "250", "local"] as FeedFilters["distance"][]).map(value => (
              <RadioRow
                key={value}
                checked={filters.distance === value}
                disabled={!locationReady && value !== "any" && value !== "local"}
                label={value === "any" ? "Any distance" : value === "local" ? "Local pickup only" : `Within ${value} miles`}
                onClick={() => update({ distance: value })}
              />
            ))}
            <div className="location-row"><div><span>Search location</span><b>{filters.searchLocation ? `${filters.searchLocation.city}, ${filters.searchLocation.region} ${filters.searchLocation.postalCode}` : "Add ZIP code"}</b></div><button onClick={() => update({ searchLocation: defaultSearchLocation })} type="button">Change</button></div>
            <CheckboxRow checked={filters.includeUnknownDistance} label="Include listings with unknown distance" onClick={() => update({ includeUnknownDistance: !filters.includeUnknownDistance })} />
          </section>

          <section className="filter-section">
            <h3>Condition</h3>
            {conditionOptions.map(([value, label]) => <CheckboxRow key={value} checked={filters.conditions.includes(value)} label={label} onClick={() => toggleCondition(value)} />)}
          </section>

          <section className="filter-section">
            <h3>Listing type</h3>
            {typeOptions.map(([value, label]) => <CheckboxRow key={value} checked={filters.listingTypes.includes(value)} label={label} onClick={() => toggleType(value)} />)}
          </section>

          <section className="filter-section">
            <h3>Availability</h3>
            <CheckboxRow checked={filters.shipsToMe} label="Ships to me" onClick={() => update({ shipsToMe: !filters.shipsToMe })} />
            <CheckboxRow checked={filters.localPickupAvailable} label="Local pickup available" onClick={() => update({ localPickupAvailable: !filters.localPickupAvailable })} />
            <CheckboxRow checked={filters.usListings} label="US listings" onClick={() => update({ usListings: !filters.usListings })} />
            <CheckboxRow checked={filters.internationalListings} label="International listings" onClick={() => update({ internationalListings: !filters.internationalListings })} />
            <CheckboxRow checked={filters.includeUnknownImportCost} label="Include listings with unknown import cost" onClick={() => update({ includeUnknownImportCost: !filters.includeUnknownImportCost })} />
          </section>

          <section className="filter-section">
            <h3>Pricing</h3>
            <CheckboxRow checked={filters.priceVisible} label="Price visible" onClick={() => update({ priceVisible: !filters.priceVisible })} />
            <CheckboxRow checked={filters.totalEstimatedCostAvailable} label="Total estimated cost available" onClick={() => update({ totalEstimatedCostAvailable: !filters.totalEstimatedCostAvailable })} />
            <CheckboxRow checked={filters.financingAvailable} label="Financing available" onClick={() => update({ financingAvailable: !filters.financingAvailable })} />
            <CheckboxRow checked={filters.offersAccepted} label="Offers accepted" onClick={() => update({ offersAccepted: !filters.offersAccepted })} />
          </section>

          <section className="filter-section">
            <button className="more-filters-toggle" onClick={() => setMoreOpen(value => !value)} type="button"><span>More filters</span><span>{moreOpen ? "▴" : "▾"}</span></button>
            {moreOpen && <div className="more-filter-body">
              <CheckboxRow checked={filters.returnsAccepted} label="Returns accepted" onClick={() => update({ returnsAccepted: !filters.returnsAccepted })} />
              <CheckboxRow checked={filters.recentlyChecked} label="Recently checked" onClick={() => update({ recentlyChecked: !filters.recentlyChecked })} />
              <CheckboxRow checked={filters.inStockOnly} label="In-stock only" onClick={() => update({ inStockOnly: !filters.inStockOnly })} />
              <CheckboxRow checked={filters.excludePossiblyStale} label="Hide older results" onClick={() => update({ excludePossiblyStale: !filters.excludePossiblyStale })} />
              <CheckboxRow checked={filters.individualListingOnly} label="Single-guitar listings only" onClick={() => update({ individualListingOnly: !filters.individualListingOnly })} />
            </div>}
          </section>
        </div>
        <div className="filter-footer"><button className="auth-choice primary" onClick={onApply} type="button">{uiCopy.filters.apply(resultCount)}</button></div>
      </div>
    </div>
  );
}

function SortSheet({ value, onChange, onClose }: { value: SortOption; onChange: (value: SortOption) => void; onClose: () => void }) {
  const options = Object.entries(sortLabels) as [SortOption, string][];
  return (
    <div className="overlay open" onClick={event => event.currentTarget === event.target && onClose()}>
      <div className="sheet sort-sheet">
        <div className="sheet-head"><div><h2>Sort by</h2><p>Choose how you want to scan the results.</p></div><button className="close" onClick={onClose} type="button">×</button></div>
        <div className="sort-options">{options.map(([option, label]) => <RadioRow key={option} checked={value === option} label={label} onClick={() => onChange(option)} />)}</div>
      </div>
    </div>
  );
}

function CheckboxRow({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return <button className="filter-choice" onClick={onClick} type="button"><span className={`box ${checked ? "checked" : ""}`}>{checked ? "✓" : ""}</span><span>{label}</span></button>;
}

function RadioRow({ checked, label, onClick, disabled = false }: { checked: boolean; label: string; onClick: () => void; disabled?: boolean }) {
  return <button className="filter-choice" disabled={disabled} onClick={onClick} type="button"><span className={`radio ${checked ? "checked" : ""}`} /> <span>{label}</span></button>;
}

function AuthSheet({ title, email, onEmailChange, onClose, onSocial, onEmail }: { title: string; email: string; onEmailChange: (value: string) => void; onClose: () => void; onSocial: (email: string, provider: string) => void; onEmail: () => void }) {
  return <div className="overlay open" onClick={event => event.currentTarget === event.target && onClose()}><div className="sheet"><div className="sheet-head"><div><h2>{title}</h2><p>{uiCopy.account.savedIntro}</p></div><button className="close" onClick={onClose} type="button">×</button></div><div className="sheet-form"><button className="auth-choice" onClick={() => onSocial("google-user@example.com", "Google")} type="button">Continue with Google</button><button className="auth-choice" onClick={() => onSocial("apple-user@example.com", "Apple")} type="button">Continue with Apple</button><div className="sheet-divider">or</div><input className="sheet-input" type="email" placeholder="Email address" value={email} onChange={event => onEmailChange(event.target.value)} /><button className="auth-choice primary" onClick={onEmail} type="button">Continue with email</button><div className="sheet-helper">{uiCopy.account.previewAuth}</div></div></div></div>;
}

function AlertSheet({ query, condition, frequency, targetPrice, international, onClose, onCondition, onFrequency, onTargetPrice, onInternational, onSave }: {
  query: string;
  condition: SavedSearch["condition"];
  frequency: SavedSearch["frequency"];
  targetPrice: string;
  international: boolean;
  onClose: () => void;
  onCondition: (value: SavedSearch["condition"]) => void;
  onFrequency: (value: SavedSearch["frequency"]) => void;
  onTargetPrice: (value: string) => void;
  onInternational: () => void;
  onSave: () => void;
}) {
  return <div className="overlay open" onClick={event => event.currentTarget === event.target && onClose()}><div className="sheet"><div className="sheet-head"><div><h2>{uiCopy.alerts.trackGuitar}</h2><p>{query}</p></div><button className="close" onClick={onClose} type="button">×</button></div><div className="alert-grid"><div className="alert-row"><div><label>Condition</label><span>Choose the listings you want to hear about.</span></div><select value={condition} onChange={event => onCondition(event.target.value as SavedSearch["condition"])}><option value="both">New and used</option><option value="new">New only</option><option value="used">Used only</option></select></div><div className="alert-row"><div><label>International listings</label><span>Include listings outside the US.</span></div><button className={`switch ${international ? "on" : ""}`} onClick={onInternational} type="button" /></div><div className="alert-row"><div><label>Target price</label><span>Optional: notify when total cost is below this.</span></div><input type="number" placeholder="$4,000" value={targetPrice} onChange={event => onTargetPrice(event.target.value)} /></div><div className="alert-row"><div><label>Alert timing</label><span>Choose how often you hear from us.</span></div><select value={frequency} onChange={event => onFrequency(event.target.value as SavedSearch["frequency"])}><option value="instant">Instant</option><option value="daily">Daily digest</option><option value="weekly">Weekly digest</option></select></div></div><button className="auth-choice primary" style={{ marginTop: 14 }} onClick={onSave} type="button">Save alert</button></div></div>;
}

function AccountSheet({ user, onClose, onSaved, onSignOut }: { user: User; onClose: () => void; onSaved: () => void; onSignOut: () => void }) {
  return <div className="overlay open" onClick={event => event.currentTarget === event.target && onClose()}><div className="sheet"><div className="sheet-head"><div><h2>Your account</h2><p>{uiCopy.account.manage}</p></div><button className="close" onClick={onClose} type="button">×</button></div><div className="account-status"><div className="account-avatar">{user.name.slice(0, 2).toUpperCase()}</div><div><b>{user.name}</b><span>{user.email} · {user.provider}</span></div></div><button className="auth-choice primary" style={{ marginTop: 14 }} onClick={onSaved} type="button">View saved searches</button><button className="text-button" onClick={onSignOut} type="button">Sign out</button></div></div>;
}

function CompareSheet({ listings, onClose }: { listings: Listing[]; onClose: () => void }) {
  return <div className="overlay open" onClick={event => event.currentTarget === event.target && onClose()}><div className="sheet"><div className="sheet-head"><div><h2>Compare listings</h2><p>Compare price, condition, and source side by side.</p></div><button className="close" onClick={onClose} type="button">×</button></div><div className="compare-grid">{listings.map(listing => <div className="compare-card" key={listing.id}><h3>{listing.source}</h3><p>{listing.title}</p><p><b>{listing.resultType === "web" ? listing.possiblePrice || uiCopy.listing.priceOnSource : money(listing.total)}</b>{listing.resultType === "web" ? "" : " est. total"}</p><p>{listing.condition} · {listing.possibleLocation || listing.country}</p></div>)}</div></div></div>;
}
