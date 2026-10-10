# Acre Circle: Test Results

All results below come from commands actually run on October 10, 2026, on macOS (Node 24.14, Next.js 16.4.0), in the hackathon build environment. The latest round was run after the page-by-page cleanup (lighter header, grouped open items, collapsed passing checks, optimizer tabs, 3-step listing form, document-style agreements).

## Summary (after the page cleanup)

| Check | Command | Result |
| --- | --- | --- |
| TypeScript (strict) | `npx tsc --noEmit` | ✅ No errors |
| ESLint | `npx eslint .` | ✅ No warnings or errors (`public/vendor/` is ignored; it holds the copied, minified MapLibre worker) |
| Unit tests | `npm test` (Vitest) | ✅ 39/39 passed: 16 engine, 1 scenario report, 11 plot-request, 6 schema, 5 open-item grouping |
| Production build | `npm run build` | ✅ Compiled; 17 routes (including `/about`), all static except `/api/explain` |
| End-to-end journey vs. production server | `BASE_URL=http://localhost:3100 node scripts/e2e.mjs` | ✅ 33/33 checks passed (re-run after the page cleanup; adds an in-place agreement edit check) |
| Map with live tiles (headless Chromium, SwiftShader WebGL) | Part of the e2e run, plus `scripts/map-debug.mjs` | ✅ Status `ready`, 5 pins, canvas fills its container |
| Map with tiles blocked | e2e check that aborts requests to `openfreemap.org` | ✅ Fallback card shown; listing panel still works |
| Reduced motion | e2e check in a `reducedMotion: "reduce"` context at 390px | ✅ Pages load without console errors; counters render final values immediately |
| Browser console errors during journey | Part of the e2e run | ✅ None (tile-server network errors are excluded; the app handles those with its fallback) |
| Responsive rendering | Screenshots at 1440px and 390px | ✅ Reviewed sign-in, dashboard, optimizer, growers, agreements, landowner listing and form, inbox, explore, requests and 404; fixed the issues listed below |
| Open Graph image | `curl /opengraph-image` | ✅ 200 `image/png`, 1200×630, reviewed visually |

### Earlier results (same day, before the upgrade; not re-run since)

| Check | Result |
| --- | --- |
| LLM route without a key (`curl /api/explain`) | ✅ `{"configured":false}`; POST returns 503; UI shows "LLM not configured" (the e2e still checks this label) |
| LLM route with a key (mock OpenAI-compatible server, `scripts/mock-llm.mjs`) | ✅ Request sent with `temperature: 0` and bearer auth; narrative rendered with "Written by mock-model…" label |
| LLM provider unreachable | ✅ API returns 502; UI shows "Could not reach the LLM provider. The rule-based explanation above remains accurate." |

## Unit tests

### Engine (`src/lib/engine/allocate.test.ts`)

1. Demo scenario places A–D at 0.50/0.50/0.25/0.25 ac (1.50 ac total, 0.50 ac reserved) and defers E for unverified irrigation.
2. Deterministic: identical inputs in a different order give an identical result and fingerprint.
3. Fingerprint changes when an input changes.
4. Owner-reported water is flagged as an open issue, not treated as verified.
5. Allocations never exceed cultivable area and always respect min/max plot size (tested at 0, 0.2, 0.25, 0.5, 0.8, 1, 1.25 and 1.5 ac).
6. Reducing cultivable land to 1.0 ac gives 3 placements, with an explanation for the eligible grower who wasn't placed.
7. No suitable matches (0.2 ac) gives no plots and a "No growers…" headline.
8. Unknown water defers water-dependent growers; no water rejects them; the self-supplied grower is still placed.
9. A budget too small for the minimum plot is rejected.
10. A reduced budget shrinks the plot (to 0.35 ac at $30/mo) instead of exceeding the budget.
11. A prohibited activity (herbs) is rejected.
12. Verified irrigation makes E placeable, still within 1.50 ac.
13. Certified-organic and conventional growers are never placed together.
14. The owner's maximum number of growers is respected.
15. Invalid property input (cultivable + reserved > total) produces no allocation.
16. Year-round grower on seasonal-only land is rejected.

### Plot requests (`src/lib/requests.test.ts`)

1. Creates a sent request with a trimmed message and the supplied id and timestamp.
2. Idempotent: a second request for the same grower and property returns the open one unchanged.
3. An accepted request also counts as a duplicate; a new request is allowed after a decline.
4. Rejects a zero or non-numeric area.
5. "Viewed" only changes a sent request; later views and closed requests are untouched.
6. Accepting adds the property to the grower's applications exactly once, without mutating the input.
7. After acceptance the grower becomes an optimizer candidate (5 → 6 evaluated) and is placed within cultivable area. This is a real engine run, not a hardcoded result.
8. Declining requires a non-blank reason and stores it trimmed.
9. Closed requests can't be accepted or declined again.
10. A request can't be accepted on behalf of a different grower.
11. The fit badge uses the engine: Grower F fits Harbour Valley and fails travel distance for Margaree Riverside.

### Schemas (`src/lib/schemas.test.ts`)

1. Every seed pin and every region centroid is inside the Nova Scotia bounds.
2. Pins outside Nova Scotia are rejected with "Pin must be in Nova Scotia."
3. Non-finite coordinates are rejected.
4. The request form accepts an area within the owner's plot range.
5. Areas outside the range are rejected with the owner's limit in the message.
6. The note must be at least 10 characters after trimming.

### Scenario report (`src/lib/engine/scenarios.report.test.ts`, actual engine output)

| Scenario | Placements (Plot: Grower = acres) | Notes |
| --- | --- | --- |
| Seed | A:A=0.50, B:B=0.50, C:C=0.25, D:D=0.25 | E deferred (irrigation unverified) |
| Cultivable 1.0 ac | A:A=0.50, B:C=0.25, C:D=0.25 | Grower B eligible but not placed: the equally productive plan without B has fewer open items (2 vs 3) |
| Water unavailable | A:D=0.25 | A, B, C and E rejected (need water) |
| Water unknown | A:D=0.25 | A, B, C and E deferred |
| Irrigation verified | A:E=0.60, B:A=0.40, C:C=0.25, D:D=0.25 | B eligible but not placed (more open items) |
| Grower B budget $15 | A:A=0.50, B:C=0.25, C:D=0.25 | B rejected: $15 covers about 0.15 ac, minimum is 0.25 ac |
| Grower A wants 0.75 ac ($60) | A:A=0.60, B:B=0.40, C:C=0.25, D:D=0.25 | Water-fill sharing of the 1.50 ac |
| Herbs prohibited | A:A=0.50, B:B=0.50, C:D=0.25 | C rejected; 0.25 ac left unallocated |

## End-to-end journey (`scripts/e2e.mjs`): 33/33 passed

Run against `next start` (production build) on port 3100:

```
PASS  Landing page shows hero headline
PASS  Try Live Demo opens Harbour Valley Farm listing (2 ac / 1.5 ac)
PASS  Find Compatible Growers navigates to optimizer
PASS  Run Optimization places 4 of 5 growers on 1.50 ac and defers Grower E
PASS  Clicking a plot opens its details panel; clearing returns to the plot list
PASS  Plot sizes are 0.50 / 0.50 / 0.25 / 0.25 ac
PASS  Explanation is labelled rule-based when no LLM key is set
PASS  Reduce land to 1.0 ac → stale warning → recalculation drops to 3 placements within 1.00 ac
PASS  Water unavailable → only the self-supplied community project is placed
PASS  Budget cut to $15/mo → Grower B not compatible
PASS  Prohibit herbs → Grower C not compatible
PASS  Verify irrigation → Grower E no longer deferred, total still ≤ 1.50 ac
PASS  Cultivable 0.2 ac → no suitable matches state
PASS  Invalid input (cultivable 1.8 + reserved 0.5 > 2 ac) is rejected, not allocated
PASS  View Allocation Details opens breakdown modal
PASS  Editing Grower B's budget on /growers updates eligibility
PASS  Reset demo restores seed data
PASS  Agreement draft shows the not-legal-advice banner and downloads
PASS  Agreement sections read as a document and edit in place
PASS  Marking a section for discussion and ready-for-review is reflected on dashboard
PASS  Landowner form validates required fields
PASS  Saving a new property makes it the active listing
PASS  Explore Land lists properties including the new one
PASS  Sign-in role picker links to dashboard
PASS  Landing role card 'I want to grow' starts the grower path on the map
      (map status: loading)
PASS  Explore: list and property panel work whether map tiles load or not
PASS  Grower sends a plot request; owner sees it in the inbox and on the listing
PASS  Owner accepts with undo, declines with a required reason, then opens the optimizer
PASS  Grower is notified and sees Accepted; dashboard pipeline counts update
PASS  Cmd/Ctrl+K palette finds a listing and navigates to it
PASS  No browser console errors during the journey
PASS  Reduced motion: key pages and the optimizer run without console errors
PASS  Offline tiles: map shows its fallback and listings still work

33/33 checks passed
```

The map status note is informational: that check passes whether or not tiles have finished loading.

The same script also passed 31/31 against the dev server, before the offline-tiles check was added.

## Failures found and fixed during testing

### Page cleanup round

- **Wrong test expectation for shared water warnings.** The grouping test assumed Grower D also gets the water warning; D is self-supplied. The test now expects Growers A, B and C. The code was correct.
- **Lint: setState inside an effect** in the guided-demo pill. It now reads the dismissed flag with `useSyncExternalStore`.
- **Mobile: "Acting as" label wrapped** on Explore, and the listing-form step labels wrapped to two lines. The grower selector now reads "Viewing as …", and inactive step labels are hidden on small screens.
- **Landowner mini-map looked partly blank** in a full-page screenshot. Measured: the canvas fills its container, and a later capture shows the map fully drawn. It was tiles still loading, not a layout bug.

### Platform upgrade round

- **Map had zero height, then stuck at 300px.** `maplibre-gl.css` sets the map container to `position: relative`, which overrode the `absolute inset-0` classes. Map containers now use an inline style.
- **Close buttons rendered top-left instead of top-right.** The `.state-layer` rule compiled outside Tailwind's cascade layers, so its `position: relative` beat the `absolute` utility. The rule now skips elements that already have `absolute`, `fixed` or `sticky`.
- **Console errors: "&lt;rect&gt; attribute width: A negative value".** A spring animation overshot plot widths below zero. Plot rectangles now use a non-overshooting easing.
- **Duplicate plot elements in e2e.** Next keeps the previously visited route mounted but hidden, and the landowner page also renders the plan. The e2e selector is now scoped to the visible page.
- **Explore selection didn't update the URL.** Selecting a listing now updates `?property=` so links and refreshes keep the selection.
- **The seeded request didn't leave room for the live loop.** Grower F is a good fit only for Harbour Valley. The seeded pending request is now Grower C → LaHave River (a real good fit), so the demo can send Grower F's Harbour Valley request live.
- **Mobile inbox overflowed sideways** because a grid column with truncated text grew past the viewport. Fixed with a `minmax(0, 1fr)` column.
- **Inbox marked the seed request "viewed" before saved data loaded.** It now waits for hydration and shows skeletons meanwhile.
- **Animated counters were silent to screen readers** (an `aria-label` on a plain `span`). They now render the number as text.
- **Open Graph overlay missing.** `next/og` ignores `inset`; it now uses explicit edges.
- **Map briefly showed the unbranded style.** Brand colours are now applied on `style.load`, before tiles draw.

### Original build

- A server component called the client-only `cn()` helper, causing a 500 on `/`. Moved `cn` to `src/lib/cn.ts`.
- `new Date()` during prerender on `/agreements` triggered a Next.js "unstable value" console error. Generated drafts no longer carry a timestamp until saved.
- The dark "Why an organization would subscribe" card on the dashboard rendered blank because a background class conflicted. Fixed.
- On mobile, the logo wrapped onto two lines and the optimizer results sat below the controls. Fixed.
- Early e2e failures were test-selector issues: duplicate "Try Live Demo" links, and Next 16 keeping the previous route mounted but hidden, which gave two `<main>` elements. Selectors are now scoped to visible elements.

## Not tested or remaining limitations

- **No live LLM provider was called.** The integration was tested only against a local mock. The quality of real model output is unverified.
- **No live deployment** was performed from this environment.
- Tested only in headless Chromium (map rendering via SwiftShader). Safari and Firefox were not tested, and neither was a real GPU or a touch device. The mobile bottom sheet was checked only by a 390px screenshot after selecting a pin. Its drag gesture was not exercised.
- Accessibility: keyboard navigation (palette, plots, pins, dialogs, Escape to close), ARIA roles and reduced motion are implemented. No formal audit (screen reader, axe) was run.
- `localStorage` persistence is per browser. Clearing site data resets the demo.
- Known remaining bugs: none observed in the tested flows.

## How to reproduce

```bash
npm install
npm run typecheck && npm run lint && npm test && npm run build
npx next start -p 3100 &
BASE_URL=http://localhost:3100 node scripts/e2e.mjs   # requires Playwright Chromium or CHROME_PATH
```
