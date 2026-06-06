# Guitar Finder Design Parity Checklist

Use `reference-prototype.html` as the only visual benchmark.

## App Shell
- [x] Clickable Guitar Finder brand returns home
- [x] Top-right Home, Saved, Account controls
- [x] Persistent bottom nav: Home, Finder, Advisor, Saved
- [x] Active bottom-nav state updates correctly

## Home
- [x] Premium light storefront layout
- [x] Search input
- [x] Advisor CTA
- [x] Quick-start cards
- [x] Saved-search entry point

## Results
- [x] Search input at top
- [x] Unified Results title and marketplace/retailer/classified summary
- [x] Refresh search action
- [x] Reset feed action
- [x] Save search action
- [x] Results toolbar uses Filters / Sort / Grid-List controls
- [x] Filter count appears only when filters are active
- [x] Active filter chips render below toolbar with remove controls
- [x] Clear all appears only when filters are active
- [x] Mobile filter bottom sheet with sticky header/footer
- [x] Filter changes are staged until Show results
- [x] Price, distance, condition, listing type, availability, pricing, and more-filter sections
- [x] Sort sheet with marketplace sort options
- [x] Sort selection updates results immediately
- [x] Grid/list toggle
- [x] Grid/list toggle preserves filters and sort
- [x] 2-column listing grid default
- [x] Card hierarchy matches prototype
- [x] Dedicated compact list-card presentation
- [x] List cards omit long snippets, descriptions, spec blocks, and redundant labels
- [x] Listing cards show available buying context without invented values
- [x] Save and compare overlays on image
- [x] View Web Result / View Listing CTA
- [x] Progressive Load more results support
- [x] Result-count copy uses found so far until cursor exhaustion
- [x] End-of-results state
- [x] Compact fallback platform links displayed below the unified feed

## Web Search Feed
- [x] Brave Search API key is server-side only
- [x] API errors show a search-error state, not zero matches
- [x] Development search diagnostics are hidden from shoppers and gated behind `?debug=1`
- [x] Server-side cache uses `WEB_SEARCH_CACHE_TTL_SECONDS`
- [x] Transient API failures and missing-key responses are not cached as empty searches
- [x] Query parser extracts structured guitar fields where possible
- [x] PRS Holcomb Core aliases resolve to one canonical Core intent
- [x] Multiple precise query variants generated
- [x] PRS Holcomb query variants include broader non-literal aliases
- [x] Non-purchasable informational pages rejected
- [x] Search-result and landing pages rejected
- [x] Buyability threshold enforced
- [x] Exact-match confidence threshold enforced
- [x] Duplicate URLs and near-duplicate titles removed
- [x] PRS Core excludes PRS SE
- [x] Fender Custom Shop excludes Vintera
- [x] Jazzmaster excludes Stratocaster
- [x] HT6 excludes HT7
- [x] Exact finish conflicts discarded
- [x] Sold, ended, and archived results warn and rank lower
- [x] Likely exact/Possible match labels kept internal and removed from shopper cards/details
- [x] Missing fields hidden rather than invented
- [x] Missing price/image metadata lowers confidence instead of automatically excluding likely exact listings
- [x] Missing images use source placeholders, not generic guitar photography
- [x] Qualified listings run through server-side metadata enrichment after exact-listing qualification
- [x] JSON-LD Product/Offer and AggregateOffer prices extracted with currency
- [x] Generic microdata, product meta, Twitter image, and embedded product JSON enrichment covered
- [x] Reverb item-page enrichment adapter added
- [x] Reverb search and Price Guide pages rejected as active listing sources
- [x] Unknown domains do not fetch page metadata without an approved policy
- [x] Search refresh bypasses stale enrichment cache
- [x] Unsafe discussion, historical, shipping-only, and financing prices rejected
- [x] MSRP/reference prices rejected
- [x] Initial web-search batch capped at 12 qualified listings
- [x] Brave Search uses count 20 with cursor-tracked offsets
- [x] Signed cursor resumes multi-query pagination
- [x] Load more deduplicates against prior emitted URLs
- [x] Pagination keeps exact-match and purchasability filters intact

## Listing Detail
- [x] Back to Results
- [x] Previous / count / next grouped together
- [x] Directional animation on navigation
- [x] Product name and condition tag
- [x] Gallery with arrows, thumbnails, and counter
- [x] Total estimated cost module
- [x] Inline expandable cost breakdown
- [x] Retailer CTA
- [x] Listing details
- [x] Purchase details
- [x] Shop identity block
- [x] Compare CTA
- [x] Plain listing details hide invented itemized cost modules
- [x] Source-backed images normalized for cards, detail pages, galleries, saved listings, and compare surfaces
- [x] Broken or missing image URLs fall back to quiet source placeholders
- [x] Gallery image URLs deduplicate and invalid URLs are filtered
- [x] Dynamic third-party images use standard `<img>` with validation and `onError` fallback
- [x] Dynamic third-party images try source-backed candidates before falling back to a quiet placeholder
- [x] Web-result detail pages use one About this listing section without repeated Domain/Match fields
- [x] Web-result detail pages hide invented shipping, tax, import, returns, financing, and zero-cost totals
- [x] Source notes are sanitized before display

## Voice And Tone
- [x] `VOICE_AND_TONE.md` added at repository root
- [x] `AGENTS.md` updated with content and UX copy guidance
- [x] Common UI labels centralized in `src/content/ui-copy.ts`
- [x] Home, results, cards, listing details, advisor, saved searches, alerts, account, filters, sort, compare, loading, pagination, empty, and error states audited
- [x] Visible shopper-facing copy avoids internal terms like canonical, purchasability, metadata, API result, and qualified listings
- [x] Finder and Advisor logic preserved while copy was updated

## Advisor
- [x] Multi-step flow
- [x] Budget options + custom range
- [x] Expanded genres
- [x] Artist/band inspiration
- [x] Tuning options + Eb + custom tuning
- [x] Used preference
- [x] Back / next navigation
- [x] Clickable stepper
- [x] Ranked results
- [x] Edit answers
- [x] Send selected recommendation into Finder

## Account + Alerts
- [x] Browsing without signup
- [x] Save-search account prompt
- [x] Save-listing account prompt
- [x] Saved-content account prompt
- [x] Sign-in sheet
- [x] Account sheet
- [x] Saved-search alert settings
- [x] Saved-search alerts store query, filters, and sort
- [x] Saved searches page
- [x] Saved listings page section

## Quality Gates
- [x] Typecheck passes
- [x] Lint passes
- [x] Tests pass
- [x] Build passes
- [x] Mobile visual parity checked

## Verification Notes
- Mobile viewport checked at 390 x 844 for the new filter/sort pass.
- Finder search uses one unified feed of purchasable individual listing/product-page candidates when the Brave key is configured.
- Filter bottom sheet, active chips, sort sheet, clear-chip behavior, query preservation, and list/grid state were verified locally.
- Mobile viewport rechecked at 390 x 844 for compact list view and pagination states.
- `fender jazzmaster custom shop fiesta red` returned six qualified listings and an exhausted cursor in the live local check, so the UI correctly showed the end-of-results state instead of Load more.
- `PRS Holcomb Core Cobalt Smokeburst` rechecked after search-pipeline diagnostics/fixes and returned 3 qualified purchasable candidates locally.
- Previous PRS zero-result behavior was traced to over-literal Holcomb Core matching and over-specific query variants; the parser now treats `PRS`, `Holcomb`, and `Core` as hard concepts while `Mark` and finish improve confidence/ranking.
- Load-more behavior is covered with mocked paginated Brave responses in unit tests because the live Jazzmaster search had no additional qualified pages available.
- Advisor Misha Mansoor / Djent / Drop A flow returned Jackson Misha and high-fit alternatives, with no Ibanez JBBM40 / JB Brubaker result.
- Direct `/listings/listing-prs-core-ish` route now uses the prototype phone shell instead of the older detail layout.
- Voice-and-tone pass checked at 390 x 844 on fresh local preview `http://127.0.0.1:3001` for home, results, listing detail, advisor, and saved prompt states.
- Listing enrichment/image pass checked on local preview `http://127.0.0.1:3001`; PRS search rendered cleanly with quiet source placeholders where no validated source-backed image was available.
- Listing-image regression fix checked on local preview `http://127.0.0.1:3002`; home rendered 6 real images and 0 placeholders, PRS search rendered 1 card with 1 real image and 0 placeholders.
- User-centered cleanup pass checked on local preview `http://127.0.0.1:3002` at 390 x 844.
- Home rendered 6 real images, 0 placeholders, and no debug/match/fallback clutter.
- PRS Holcomb Core Cobalt Smokeburst local check rendered 4 listing cards, 4 real images, 0 placeholders, 3 quiet price fallbacks, no `$0` totals, no diagnostics, no Possible/Likely match labels, no Availability unverified copy, and no raw HTML.
- PRS in-app listing detail showed one Back to results button, one listing-price block, one About this listing section, sanitized source notes, no Domain/Match repetition, and no invented cost module.
- Fender Custom Shop '63 Strat Sonic Blue local check rendered 7 listing cards, 5 real images, 2 quiet placeholders, 6 quiet price fallbacks, no `$0` totals, no diagnostics, no Possible/Likely match labels, no Availability unverified copy, and no raw HTML.
- Web-search unit tests cover Wikipedia, brand/category/search-page rejection, PRS SE, Vintera, Jazzmaster/Stratocaster, HT6/HT7, finish conflicts, purchasability, dedupe, ranking, stale results, cache TTL, missing fields, source placeholders, server-only API key, and compact fallback links.
- Listing enrichment tests cover JSON-LD Offer price/currency/image extraction, AggregateOffer lowPrice, Reverb item-page handling, Reverb search/Price Guide rejection, unsafe price rejection, unknown-domain no-fetch behavior, and enrichment cache refresh.
- Listing image tests cover safe URL validation, malformed/empty/tracking image rejection, gallery dedupe, and reusable onError placeholder fallback wiring.
- Feed filter tests cover price modes, incomplete cost handling, distance and unknown distance, local pickup, condition/type filters, international/shipping/pricing feature filters, stale filtering, sort options, chip removal, saved alert state, compare, and filtered detail-navigation order.
