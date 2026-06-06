# AGENTS.md — Guitar Finder UI Implementation Rules

## Primary instruction

The file `reference-prototype.html` is the visual and UX source of truth.

Do not redesign the app.
Do not simplify the design.
Do not invent a new color palette.
Do not replace the interaction model.
Do not substitute your own component hierarchy unless needed internally to reproduce the exact visible result.

Your job is to rebuild the prototype faithfully inside the production Next.js app.

## Non-negotiable visual direction

Use the reference prototype as the exact benchmark for:

- page hierarchy
- typography scale
- spacing
- card proportions
- light neutral palette
- blue primary action color
- surface treatments
- shadows
- border radius
- bottom navigation
- search controls
- filters
- listing cards
- account prompts
- saved-search alerts
- listing detail pages
- advisor flow
- cost breakdown interaction
- previous / next listing navigation

The result should look materially identical at mobile widths.

## Required UX states

Implement all of the following:

1. Home page
   - primary search input
   - quick-start cards
   - advisor entry point
   - saved-search entry point
   - persistent bottom navigation

2. Finder results
   - exact-match results only
   - default 2-column grid
   - list/grid toggle
   - condition filters
   - region filters
   - reset feed action
   - save search action
   - listing cards with:
     - image
     - source/shop name
     - instrument name
     - condition
     - finish
     - total estimated cost
     - save icon overlay
     - compare icon overlay
     - view listing CTA

3. Listing detail page
   - one Back to Results button
   - grouped previous / position / next navigation
   - subtle directional transition when switching listings
   - product name and condition tag
   - gallery with arrows, counter, and thumbnails
   - total estimated cost module
   - inline expandable cost breakdown inside the same module
   - retailer CTA
   - listing information
   - purchase details
   - about listing / shop identity
   - compare action

4. Advisor
   - multi-step guided flow
   - budget presets plus custom range
   - broad genre categories
   - artist inspiration input
   - tuning options including Eb plus custom tuning
   - used-guitar preference
   - visible step navigation
   - ranked recommendation list
   - edit quiz answers path
   - route selected recommendation into Finder

5. Account + alerts
   - browsing works without login
   - signup prompt only when user saves a search, saves a listing, or opens saved content
   - sign-in sheet
   - simulated auth can remain for local preview until Supabase Auth is wired
   - saved-search alert settings:
     - new / used / both
     - international toggle
     - target price
     - alert timing
   - saved-searches page
   - saved individual listings
   - account sheet

## Exact-match product principle

Never show approximate substitutes in Finder mode.

Examples:
- PRS Mark Holcomb Core must not show PRS SE Mark Holcomb
- Fender Custom Shop 1963 Stratocaster Sonic Blue must not show Fender Vintera Stratocaster Sonic Blue

When no exact result exists, show an empty state and offer Save Search.

## Implementation constraints

- Build with Next.js App Router and TypeScript.
- Reuse the existing database and engine work where practical.
- Prefer small reusable components.
- Preserve the prototype interactions before adding backend complexity.
- Keep a `design-parity-checklist.md` file and mark every item complete.
- Add screenshot-based visual regression checks if practical.
- Run `npm test`, `npm run lint`, and `npm run build`.
- Fix all errors before finishing.

## Acceptance criteria

The task is not complete until:

- the mobile app visually matches `reference-prototype.html`
- the main UX flows work end-to-end
- no prior Codex-created design remains unless it matches the reference
- the production code builds successfully
- a summary lists any differences that could not be reproduced exactly

## Content and UX copy

Read `VOICE_AND_TONE.md` before writing or editing any user-facing copy.

Treat it as the source of truth for:

- headlines
- helper text
- empty states
- buttons
- tags
- filters
- alerts
- error messages
- account prompts
- advisor copy
- listing-page copy
- loading states
- pagination copy
- fallback-platform copy

Do not expose internal implementation language to users.

Avoid sterile language such as:

- qualified listings
- canonical model
- web discovery
- purchasability
- metadata
- normalized listing
- validation threshold
- external search module
- API response
- source registry

Use conversational, efficient language that makes guitar shopping feel enjoyable.

Before finishing any frontend work:

1. Audit all visible copy.
2. Replace technical or corporate language.
3. Check consistency against `VOICE_AND_TONE.md`.
4. Keep UI copy concise.
5. Confirm that the app feels knowledgeable and fun without becoming gimmicky.
