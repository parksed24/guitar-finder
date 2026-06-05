# Guitar Finder Engine

This is a production-oriented starter package for the core intelligence layer of a centralized guitar buying hub.

It separates two jobs:

1. **Finder mode**
   - Strict exact-model listing search.
   - No "close enough" substitutions.
   - Example: a search for a `Fender Custom Shop 1963 Stratocaster Sonic Blue` must not return a `Vintera Stratocaster Sonic Blue`.

2. **Advisor mode**
   - Hard constraints first.
   - Ranked recommendations second.
   - Artist-signature relationships and verified documented-use relationships outrank broad style similarity.
   - Alternatives are explicitly labeled as alternatives.

## Core principles

- Prefer **no result** over a wrong result.
- Do not recommend from LLM memory.
- Do not show products outside hard user constraints.
- Treat model, family, tier, year, and finish as first-class fields.
- Keep artist relationships sourced and confidence-scored.
- Use AI to extract, normalize, and explain — not to invent facts.

## Included

- TypeScript domain model
- Canonical guitar catalog schema
- Exact-match listing matcher
- Advisor hard-filter + ranking engine
- Confidence score
- Recommendation diversification
- Admin-review queue concept
- Seed data for Misha Mansoor, JB Brubaker, Tele, and Custom Shop/Vintera edge cases
- Tests for:
  - wrong SE model excluded from Core search
  - Vintera excluded from Custom Shop 1963 search
  - Misha Mansoor + Djent + $3k–$5k recommends Jackson signature guitars first
  - JB Brubaker JBBM40 only appears when the relationship and budget fit
  - out-of-budget products excluded

## Run

```bash
npm install
npm test
npm run typecheck
```

## Next production step

Connect this engine to:

- PostgreSQL / Supabase
- retailer feeds and permitted ingestion jobs
- marketplace APIs
- admin review queue
- landed-cost service
- a frontend search API
