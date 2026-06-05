import { createClient } from "@supabase/supabase-js";
import { guitars, listings } from "../src/engine/catalog";
import { normalizeText } from "../src/engine/normalize";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export function buildSeedRows() {
  const artists = new Map<string, { id: string; name: string; normalized_name: string }>();
  const guitarModels = guitars.map(guitar => ({
    id: guitar.id,
    canonical_slug: guitar.id,
    brand: guitar.brand,
    family: guitar.family,
    model: guitar.model,
    variant: guitar.variant ?? null,
    finish: guitar.finish ?? null,
    year_start: guitar.yearStart ?? null,
    year_end: guitar.yearEnd ?? null,
    production_status: guitar.productionStatus,
    strings: guitar.strings,
    scale_length: guitar.scaleLength ?? null,
    bridge_type: guitar.bridgeType,
    pickup_configuration: guitar.pickupConfiguration,
    pickup_type: guitar.pickupType,
    body_style: guitar.bodyStyle,
    typical_new_price: guitar.typicalNewPrice ?? null,
    typical_used_low: guitar.typicalUsedLow ?? null,
    typical_used_high: guitar.typicalUsedHigh ?? null,
    approved: true
  }));

  const tuningSuitability = guitars.flatMap(guitar =>
    guitar.tuningSuitability.map(tuning => ({
      guitar_model_id: guitar.id,
      tuning,
      confidence: 1
    }))
  );

  const genreFits = guitars.flatMap(guitar =>
    guitar.genres.map(fit => ({
      guitar_model_id: guitar.id,
      genre: fit.genre,
      score: fit.score,
      confidence: fit.confidence,
      reasons: fit.reasons as Json
    }))
  );

  const artistRelationships = guitars.flatMap(guitar =>
    guitar.artistRelationships.map(relationship => {
      const id = normalizeText(relationship.artist).replaceAll(" ", "-");
      artists.set(id, {
        id,
        name: relationship.artist,
        normalized_name: normalizeText(relationship.artist)
      });

      return {
        guitar_model_id: guitar.id,
        artist_id: id,
        relationship_type: relationship.relationship,
        confidence: relationship.confidence,
        source_url: relationship.sourceUrl,
        checked_at: guitar.sources[0]?.checkedAt ?? new Date().toISOString()
      };
    })
  );

  const guitarSources = guitars.flatMap(guitar =>
    guitar.sources.map(source => ({
      guitar_model_id: guitar.id,
      source_url: source.sourceUrl,
      source_type: source.sourceType,
      checked_at: source.checkedAt
    }))
  );

  const listingRows = listings.map(listing => ({
    id: listing.id,
    guitar_model_id: listing.guitarModelId,
    seller_name: listing.seller,
    seller_type: listing.sellerType,
    condition: listing.condition,
    item_price: listing.itemPrice,
    shipping: listing.shipping,
    estimated_tax: listing.estimatedTax,
    estimated_import: listing.estimatedImport,
    currency: listing.currency,
    country: listing.country,
    source_url: listing.sourceUrl,
    checked_at: listing.checkedAt,
    approved: true,
    raw_payload: listing as unknown as Json
  }));

  return {
    artists: [...artists.values()],
    guitarModels,
    tuningSuitability,
    genreFits,
    artistRelationships,
    guitarSources,
    listings: listingRows
  };
}

export function validateSeedCatalog() {
  const errors: string[] = [];
  const guitarIds = new Set(guitars.map(guitar => guitar.id));
  const listingIds = new Set<string>();

  if (guitarIds.size !== guitars.length) errors.push("Guitar model IDs must be unique.");

  for (const listing of listings) {
    if (!guitarIds.has(listing.guitarModelId)) {
      errors.push(`Listing ${listing.id} references missing guitar model ${listing.guitarModelId}.`);
    }

    if (listingIds.has(listing.id)) errors.push(`Duplicate listing ID ${listing.id}.`);
    listingIds.add(listing.id);
  }

  const jbbm40 = guitars.find(guitar => guitar.id === "ibanez-jbbm40");
  const hasCorrectArtist = jbbm40?.artistRelationships.some(
    relationship => relationship.artist === "JB Brubaker" && relationship.relationship === "signature-model"
  );

  if (!jbbm40 || jbbm40.model !== "JBBM40 JB Brubaker Signature" || !hasCorrectArtist) {
    errors.push("Ibanez JBBM40 must be stored as the JB Brubaker Signature model.");
  }

  const prsCore = guitars.find(guitar => guitar.id === "prs-holcomb-core-cobalt");
  const prsSe = guitars.find(guitar => guitar.id === "prs-se-holcomb");

  if (!prsCore || !prsSe || prsCore.family === prsSe.family) {
    errors.push("PRS Holcomb Core and SE records must remain distinct families.");
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

type DynamicSupabaseClient = {
  from: (table: string) => {
    upsert: (rows: never[]) => Promise<{ error: { message: string } | null }>;
  };
};

async function upsertTable(client: DynamicSupabaseClient, table: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const { error } = await client.from(table).upsert(rows as never[]);
  if (error) throw new Error(`${table}: ${error.message}`);
}

export async function seedSupabase() {
  const validation = validateSeedCatalog();
  if (!validation.ok) throw new Error(validation.errors.join("\n"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  }

  const client = createClient(url, secretKey, {
    auth: {
      persistSession: false
    }
  });

  const rows = buildSeedRows();

  const dynamicClient = client as unknown as DynamicSupabaseClient;

  await upsertTable(dynamicClient, "artists", rows.artists);
  await upsertTable(dynamicClient, "guitar_models", rows.guitarModels);
  await upsertTable(dynamicClient, "guitar_tuning_suitability", rows.tuningSuitability);
  await upsertTable(dynamicClient, "guitar_genre_fit", rows.genreFits);
  await upsertTable(dynamicClient, "guitar_sources", rows.guitarSources);
  await upsertTable(dynamicClient, "guitar_artist_relationships", rows.artistRelationships);
  await upsertTable(dynamicClient, "listings", rows.listings);

  return {
    guitars: rows.guitarModels.length,
    listings: rows.listings.length,
    artists: rows.artists.length
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedSupabase()
    .then(result => {
      console.log(`Seeded ${result.guitars} guitars, ${result.listings} listings, ${result.artists} artists.`);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
