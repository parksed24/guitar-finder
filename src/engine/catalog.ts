import type { GuitarModel, Listing } from "./types";

const checkedAt = "2026-06-04T00:00:00Z";

export const guitars: GuitarModel[] = [
  {
    id: "jackson-misha-ht6",
    brand: "Jackson",
    family: "USA Signature",
    model: "Misha Mansoor Juggernaut HT6",
    variant: "HT6",
    productionStatus: "current",
    strings: 6,
    scaleLength: 25.5,
    bridgeType: "hardtail",
    pickupConfiguration: "HH",
    pickupType: "passive",
    bodyStyle: "superstrat",
    tuningSuitability: ["standard", "eb", "drop d", "drop c"],
    typicalNewPrice: 4399,
    typicalUsedLow: 3200,
    typicalUsedHigh: 3900,
    genres: [
      { genre: "djent", score: 100, reasons: ["artist-signature model", "hardtail", "modern-metal voicing"], confidence: 0.99 },
      { genre: "progressive metal", score: 98, reasons: ["artist-signature model", "technical playing fit"], confidence: 0.99 },
      { genre: "metalcore", score: 86, reasons: ["hardtail", "modern-metal voicing"], confidence: 0.9 }
    ],
    artistRelationships: [
      { artist: "Misha Mansoor", relationship: "signature-model", confidence: 1, sourceUrl: "manufacturer://jackson-misha-ht6" },
      { artist: "Periphery", relationship: "documented-era", confidence: 0.95, sourceUrl: "manufacturer://jackson-misha-ht6" }
    ],
    sources: [{ sourceUrl: "manufacturer://jackson-misha-ht6", sourceType: "manufacturer", checkedAt }]
  },
  {
    id: "jackson-misha-ht7",
    brand: "Jackson",
    family: "USA Signature",
    model: "Misha Mansoor Juggernaut HT7",
    variant: "HT7",
    productionStatus: "current",
    strings: 7,
    scaleLength: 26.5,
    bridgeType: "hardtail",
    pickupConfiguration: "HH",
    pickupType: "passive",
    bodyStyle: "superstrat",
    tuningSuitability: ["standard", "drop a", "drop g#", "drop c"],
    typicalNewPrice: 4799,
    typicalUsedLow: 3400,
    typicalUsedHigh: 4200,
    genres: [
      { genre: "djent", score: 100, reasons: ["artist-signature model", "extended range", "hardtail"], confidence: 0.99 },
      { genre: "progressive metal", score: 100, reasons: ["extended range", "technical playing fit"], confidence: 0.99 }
    ],
    artistRelationships: [
      { artist: "Misha Mansoor", relationship: "signature-model", confidence: 1, sourceUrl: "manufacturer://jackson-misha-ht7" },
      { artist: "Periphery", relationship: "documented-era", confidence: 0.95, sourceUrl: "manufacturer://jackson-misha-ht7" }
    ],
    sources: [{ sourceUrl: "manufacturer://jackson-misha-ht7", sourceType: "manufacturer", checkedAt }]
  },
  {
    id: "mayones-duvell-elite-7",
    brand: "Mayones",
    family: "Duvell",
    model: "Duvell Elite 7",
    productionStatus: "current",
    strings: 7,
    scaleLength: 25.4,
    bridgeType: "hardtail",
    pickupConfiguration: "HH",
    pickupType: "passive",
    bodyStyle: "superstrat",
    tuningSuitability: ["standard", "drop a", "drop g#", "drop c"],
    typicalNewPrice: 3995,
    typicalUsedLow: 2900,
    typicalUsedHigh: 3600,
    genres: [
      { genre: "djent", score: 94, reasons: ["extended range", "premium modern-metal platform"], confidence: 0.9 },
      { genre: "progressive metal", score: 92, reasons: ["extended range", "boutique build"], confidence: 0.9 }
    ],
    artistRelationships: [],
    sources: [{ sourceUrl: "manufacturer://mayones-duvell-elite-7", sourceType: "manufacturer", checkedAt }]
  },
  {
    id: "musicman-jp15-7",
    brand: "Ernie Ball Music Man",
    family: "JP15",
    model: "JP15 7 String",
    productionStatus: "current",
    strings: 7,
    scaleLength: 25.5,
    bridgeType: "tremolo",
    pickupConfiguration: "HH",
    pickupType: "passive",
    bodyStyle: "superstrat",
    tuningSuitability: ["standard", "drop a", "drop c"],
    typicalNewPrice: 3999,
    typicalUsedLow: 2900,
    typicalUsedHigh: 3500,
    genres: [
      { genre: "djent", score: 82, reasons: ["extended range", "technical playing fit"], confidence: 0.82 },
      { genre: "progressive metal", score: 96, reasons: ["technical playing fit", "versatile electronics"], confidence: 0.95 }
    ],
    artistRelationships: [
      { artist: "John Petrucci", relationship: "signature-model", confidence: 1, sourceUrl: "manufacturer://musicman-jp15-7" }
    ],
    sources: [{ sourceUrl: "manufacturer://musicman-jp15-7", sourceType: "manufacturer", checkedAt }]
  },
  {
    id: "musicman-majesty",
    brand: "Ernie Ball Music Man",
    family: "Majesty",
    model: "Majesty",
    productionStatus: "current",
    strings: 6,
    scaleLength: 25.5,
    bridgeType: "tremolo",
    pickupConfiguration: "HH",
    pickupType: "passive",
    bodyStyle: "superstrat",
    tuningSuitability: ["standard", "eb", "drop d"],
    typicalNewPrice: 4499,
    typicalUsedLow: 3200,
    typicalUsedHigh: 4000,
    genres: [
      { genre: "progressive metal", score: 96, reasons: ["premium prog platform", "versatile electronics"], confidence: 0.95 },
      { genre: "djent", score: 76, reasons: ["premium technical platform"], confidence: 0.75 }
    ],
    artistRelationships: [
      { artist: "John Petrucci", relationship: "signature-model", confidence: 1, sourceUrl: "manufacturer://musicman-majesty" }
    ],
    sources: [{ sourceUrl: "manufacturer://musicman-majesty", sourceType: "manufacturer", checkedAt }]
  },
  {
    id: "ibanez-jbbm40",
    brand: "Ibanez",
    family: "Signature",
    model: "JBBM40 JB Brubaker Signature",
    productionStatus: "current",
    strings: 6,
    scaleLength: 25.5,
    bridgeType: "hardtail",
    pickupConfiguration: "HH",
    pickupType: "active",
    bodyStyle: "superstrat",
    tuningSuitability: ["drop c", "drop b"],
    typicalNewPrice: 1199,
    typicalUsedLow: 800,
    typicalUsedHigh: 1000,
    genres: [
      { genre: "metalcore", score: 98, reasons: ["artist-signature model", "active pickups", "hardtail"], confidence: 0.99 }
    ],
    artistRelationships: [
      { artist: "JB Brubaker", relationship: "signature-model", confidence: 1, sourceUrl: "manufacturer://ibanez-jbbm40" },
      { artist: "August Burns Red", relationship: "documented-era", confidence: 0.98, sourceUrl: "manufacturer://ibanez-jbbm40" }
    ],
    sources: [{ sourceUrl: "manufacturer://ibanez-jbbm40", sourceType: "manufacturer", checkedAt }]
  },
  {
    id: "fender-custom-shop-1963-strat-sonic-blue",
    brand: "Fender",
    family: "Custom Shop",
    model: "1963 Stratocaster",
    finish: "Sonic Blue",
    productionStatus: "current",
    strings: 6,
    scaleLength: 25.5,
    bridgeType: "tremolo",
    pickupConfiguration: "SSS",
    pickupType: "passive",
    bodyStyle: "stratocaster",
    tuningSuitability: ["standard", "eb"],
    typicalNewPrice: 4599,
    typicalUsedLow: 3400,
    typicalUsedHigh: 4200,
    genres: [{ genre: "blues", score: 92, reasons: ["vintage strat platform"], confidence: 0.9 }],
    artistRelationships: [],
    sources: [{ sourceUrl: "manufacturer://fender-custom-shop-1963-strat-sonic-blue", sourceType: "manufacturer", checkedAt }]
  },
  {
    id: "fender-vintera-ii-60s-strat-sonic-blue",
    brand: "Fender",
    family: "Vintera II",
    model: "60s Stratocaster",
    finish: "Sonic Blue",
    productionStatus: "current",
    strings: 6,
    scaleLength: 25.5,
    bridgeType: "tremolo",
    pickupConfiguration: "SSS",
    pickupType: "passive",
    bodyStyle: "stratocaster",
    tuningSuitability: ["standard", "eb"],
    typicalNewPrice: 1149,
    typicalUsedLow: 850,
    typicalUsedHigh: 1000,
    genres: [{ genre: "blues", score: 80, reasons: ["vintage-style strat platform"], confidence: 0.8 }],
    artistRelationships: [],
    sources: [{ sourceUrl: "manufacturer://fender-vintera-ii-60s-strat-sonic-blue", sourceType: "manufacturer", checkedAt }]
  },
  {
    id: "prs-holcomb-core-cobalt",
    brand: "PRS",
    family: "Core",
    model: "Mark Holcomb Core",
    finish: "Cobalt Smokeburst",
    productionStatus: "current",
    strings: 6,
    scaleLength: 25.5,
    bridgeType: "hardtail",
    pickupConfiguration: "HH",
    pickupType: "passive",
    bodyStyle: "doublecut",
    tuningSuitability: ["standard", "drop c", "drop b"],
    typicalNewPrice: 4999,
    typicalUsedLow: 4000,
    typicalUsedHigh: 4500,
    genres: [{ genre: "progressive metal", score: 95, reasons: ["artist-signature model"], confidence: 0.95 }],
    artistRelationships: [{ artist: "Mark Holcomb", relationship: "signature-model", confidence: 1, sourceUrl: "manufacturer://prs-holcomb-core" }],
    sources: [{ sourceUrl: "manufacturer://prs-holcomb-core", sourceType: "manufacturer", checkedAt }]
  },
  {
    id: "prs-se-holcomb",
    brand: "PRS",
    family: "SE",
    model: "SE Mark Holcomb",
    finish: "Holcomb Burst",
    productionStatus: "current",
    strings: 6,
    scaleLength: 25.5,
    bridgeType: "hardtail",
    pickupConfiguration: "HH",
    pickupType: "passive",
    bodyStyle: "doublecut",
    tuningSuitability: ["standard", "drop c", "drop b"],
    typicalNewPrice: 1199,
    typicalUsedLow: 800,
    typicalUsedHigh: 1000,
    genres: [{ genre: "progressive metal", score: 88, reasons: ["signature-inspired value option"], confidence: 0.85 }],
    artistRelationships: [{ artist: "Mark Holcomb", relationship: "signature-model", confidence: 0.95, sourceUrl: "manufacturer://prs-se-holcomb" }],
    sources: [{ sourceUrl: "manufacturer://prs-se-holcomb", sourceType: "manufacturer", checkedAt }]
  }
];

export const listings: Listing[] = [
  {
    id: "listing-prs-core-ish",
    guitarModelId: "prs-holcomb-core-cobalt",
    seller: "Ish Guitars",
    sellerType: "boutique-shop",
    condition: "new",
    itemPrice: 4899,
    shipping: 65,
    estimatedTax: 343,
    estimatedImport: 0,
    currency: "USD",
    country: "US",
    sourceUrl: "retailer://ish/prs-holcomb-core-cobalt",
    checkedAt
  },
  {
    id: "listing-prs-se-gc",
    guitarModelId: "prs-se-holcomb",
    seller: "Guitar Center",
    sellerType: "retailer",
    condition: "new",
    itemPrice: 1199,
    shipping: 0,
    estimatedTax: 84,
    estimatedImport: 0,
    currency: "USD",
    country: "US",
    sourceUrl: "retailer://gc/prs-se-holcomb",
    checkedAt
  },
  {
    id: "listing-custom-shop-wildwood",
    guitarModelId: "fender-custom-shop-1963-strat-sonic-blue",
    seller: "Wildwood Guitars",
    sellerType: "boutique-shop",
    condition: "new",
    itemPrice: 4599,
    shipping: 0,
    estimatedTax: 322,
    estimatedImport: 0,
    currency: "USD",
    country: "US",
    sourceUrl: "retailer://wildwood/custom-shop-1963-sonic-blue",
    checkedAt
  },
  {
    id: "listing-vintera-example",
    guitarModelId: "fender-vintera-ii-60s-strat-sonic-blue",
    seller: "Example Shop",
    sellerType: "retailer",
    condition: "new",
    itemPrice: 1149,
    shipping: 0,
    estimatedTax: 80,
    estimatedImport: 0,
    currency: "USD",
    country: "US",
    sourceUrl: "retailer://example/vintera-sonic-blue",
    checkedAt
  }
];
