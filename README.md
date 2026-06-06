# Guitar Finder

A production-oriented Next.js App Router application for strict guitar model search, open-web guitar listing discovery, and constrained recommendation.

The app has two modes:

- **Finder** works as a focused guitar web-search engine. It queries Brave Web Search server-side, then qualifies purchasable individual guitar listings into one unified feed.
- **Advisor** applies hard constraints before ranking. Budget, string count, tuning, condition preference, pickup type, and bridge preference exclude invalid products before scoring.

## Core Principles

- Prefer zero results over incorrect results.
- A Core query must never return an SE model.
- A Fender Custom Shop 1963 Stratocaster Sonic Blue query must never return a Vintera Stratocaster.
- Direct artist-signature relationships outrank style-adjacent alternatives.
- Alternatives are clearly labeled as alternatives.
- Ibanez JBBM40 is stored as the JB Brubaker Signature model and is not returned for Misha Mansoor recommendations.
- Discovered listings are labeled as `Likely exact match` or `Possible exact match`.
- Guitar Finder does not invent itemized cost, shipping, tax, condition, imagery, or availability for search-discovered listings.

## Local Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-service-role-or-secret-key
BRAVE_SEARCH_API_KEY=your-brave-search-api-key
WEB_SEARCH_CACHE_TTL_SECONDS=900
LISTING_ENRICHMENT_CACHE_TTL_SECONDS=900
LISTING_IMAGE_CACHE_TTL_SECONDS=3600
LISTING_IMAGE_MAX_BYTES=5000000
```

Install dependencies and run locally:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

`BRAVE_SEARCH_API_KEY` is server-only. Do not prefix it with `NEXT_PUBLIC_`. If it is missing, Finder still renders the UI and compact fallback links, but live Brave listing discovery is disabled.

## Web Search Feed

Finder uses the Brave Web Search API:

```text
https://api.search.brave.com/res/v1/web/search
```

For each user query, the server:

1. Parses guitar-specific fields such as brand, family/tier, model, variant, finish, year, string count, and artist signature when possible.
2. Generates multiple precise search variants, including targeted searches for Reverb, eBay, Craigslist, The Gear Page, Facebook Marketplace, UK, and Japan.
3. Calls Brave Search server-side only.
4. Classifies each candidate for exact-model fit and individual-listing intent.
5. Rejects informational pages, broad landing pages, platform search pages, reviews, sold/archived pages without availability evidence, and contradictory model/finish/tier matches.
6. Runs permitted metadata enrichment only after a URL has already passed qualification.
7. Extracts source-backed prices and images from search rich results, JSON-LD offers, Open Graph data, and approved source-specific adapters.
8. Merges results, removes duplicate URLs and near-duplicate titles, ranks by exact match, buyability, metadata completeness, freshness, and source quality.
9. Returns the listing feed with safe fields: title, URL, source domain/name/type, source-backed price when confidence is high, availability warning, and validated source-backed image data when available.

Open-web search responses are cached in memory for `WEB_SEARCH_CACHE_TTL_SECONDS` seconds. Listing metadata enrichment is cached briefly with `LISTING_ENRICHMENT_CACHE_TTL_SECONDS`. The cache is transient and is not a permanent copied database of source-page content.

The UI shows compact fallback links below the unified feed:

- Facebook Marketplace
- Craigslist
- The Gear Page Guitar Emporium
- Reverb
- eBay
- Google

## Supabase Migration

The migration lives at:

```text
supabase/migrations/20260605000000_initial_catalog.sql
```

Apply it with the Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

The schema enables Row Level Security. Public clients can read approved guitar models and approved listings. Inserts, edits, approvals, and deletes are intentionally left to server-side service-role operations.

## Seeding Catalog Data

Seed data is imported from `src/engine/catalog.ts`.

```bash
npm run seed:supabase
```

For local development only, you can also call:

```bash
curl -X POST http://localhost:3000/api/admin/seed
```

That endpoint returns `404` in production.

## API Routes

- `GET /api/health`
- `POST /api/finder/search`
- `POST /api/advisor/recommend`
- `POST /api/admin/seed` development only

Finder request:

```json
{
  "query": "PRS Holcomb Core Cobalt Smokeburst"
}
```

Finder response includes the existing exact catalog fields for compatibility plus the production unified-feed fields:

```json
{
  "mode": "web-search",
  "webResults": [
    {
      "title": "PRS Mark Holcomb Core Cobalt Smokeburst",
      "url": "https://example.com/listing",
      "sourceDomain": "example.com",
      "snippet": "Search-result snippet",
      "confidence": "Likely exact match",
      "exactMatchConfidence": 0.97,
      "buyabilityScore": 0.92,
      "availabilityWarning": "Verify details on source."
    }
  ],
  "webSummary": "Searched across the web · 1 relevant result · Refreshed moments ago",
  "shortcuts": []
}
```

Advisor request:

```json
{
  "budgetMin": 3000,
  "budgetMax": 5000,
  "genres": ["djent"],
  "artists": ["Misha Mansoor"],
  "tunings": ["Drop A"],
  "strings": 7,
  "conditionPreference": "new-only"
}
```

## Vercel Deployment

1. Import the GitHub repository into Vercel.
2. Add the environment variables from `.env.local.example`.
3. Set the install command to `npm install`.
4. Set the build command to `npm run build`.
5. Deploy from the production branch.

Keep `SUPABASE_SECRET_KEY` and `BRAVE_SEARCH_API_KEY` server-only. Do not prefix either with `NEXT_PUBLIC_`.

## Tests

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The test suite covers the preserved engine behavior, API routes, and Supabase seed validation.

## Known Limitations

- Finder parsing and purchasability classification are intentionally conservative and may discard broad or uncertain pages.
- Brave Search coverage depends on what is indexed; the app also provides compact fallback links because some marketplace pages may be missing or stale.
- Search-discovered listings do not include invented landed-cost calculations or stock imagery. Itemized cost modules appear only for Guitar Finder-owned catalog/listing data.
- Unknown retailer domains use search-result metadata only until a source enrichment policy is approved.
- Real source-backed listing images render when available; missing or broken images fall back to quiet source placeholders.

## Next Steps For Retailer Ingestion

- Keep the MVP web-search feed as the first production discovery path.
- Add permitted retailer feed/API ingestion jobs only after the web-search MVP is validated.
- Normalize incoming model, family, tier, year, finish, condition, seller, and landed-cost fields.
- Route ambiguous or low-confidence matches into `ingestion_review_queue`.
- Add source-specific enrichment adapters for Sweetwater, Guitar Center, zZounds, eBay, boutique shops, and international retailers.
- Require approval before new models or listings become public.
- Add source freshness checks and stale-listing expiry.
