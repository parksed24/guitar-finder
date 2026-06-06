# Guitar Finder

A production-oriented Next.js App Router application for strict guitar model search and constrained recommendation.

The app has two modes:

- **Finder** returns strict exact-model listing matches only. It does not substitute cheaper, similar, or adjacent products.
- **Advisor** applies hard constraints before ranking. Budget, string count, tuning, condition preference, pickup type, and bridge preference exclude invalid products before scoring.

## Core Principles

- Prefer zero results over incorrect results.
- A Core query must never return an SE model.
- A Fender Custom Shop 1963 Stratocaster Sonic Blue query must never return a Vintera Stratocaster.
- Direct artist-signature relationships outrank style-adjacent alternatives.
- Alternatives are clearly labeled as alternatives.
- Ibanez JBBM40 is stored as the JB Brubaker Signature model and is not returned for Misha Mansoor recommendations.

## Local Setup

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-service-role-or-secret-key
```

Install dependencies and run locally:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

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
2. Add the three environment variables from `.env.local`.
3. Set the install command to `npm install`.
4. Set the build command to `npm run build`.
5. Deploy from the production branch.

Keep `SUPABASE_SECRET_KEY` server-only. Do not prefix it with `NEXT_PUBLIC_`.

## Tests

```bash
npm test
npm run build
```

The test suite covers the preserved engine behavior, API routes, and Supabase seed validation.

## Known Limitations

- Finder query parsing currently covers the seeded exact-match examples and returns zero results when it cannot safely interpret a query.
- Listings are seeded fixtures, not live retailer inventory.
- Cost estimates are fixture-level estimates and do not yet calculate user-specific tax, duty, or shipping.
- Product art is generated locally for UI continuity; real retailer photo ingestion is a future integration.

## Next Steps For Retailer Ingestion

- Add permitted retailer feed/API ingestion jobs.
- Normalize incoming model, family, tier, year, finish, condition, seller, and landed-cost fields.
- Route ambiguous or low-confidence matches into `ingestion_review_queue`.
- Require approval before new models or listings become public.
- Add source freshness checks and stale-listing expiry.
