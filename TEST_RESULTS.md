# Acre Circle: Test Results

All results below come from commands actually run on October 10, 2026, on macOS (Node 24.14, Next.js 16.4.0), in the hackathon build environment.

## Summary

| Check | Command | Result |
| --- | --- | --- |
| TypeScript (strict) | `npx tsc --noEmit` | ✅ No errors |
| ESLint | `npx eslint .` | ✅ No warnings or errors |
| Engine unit tests | `npm test` (Vitest) | ✅ 17/17 passed (16 assertions plus 1 scenario report) |
| Production build | `npm run build` | ✅ Compiled; 12/12 pages generated (all static except `/api/explain`) |
| End-to-end journey vs. production server | `BASE_URL=http://localhost:3100 node scripts/e2e.mjs` | ✅ 23/23 checks passed |
| Browser console errors during journey | Part of the e2e run | ✅ None |
| LLM route without a key | `curl /api/explain` | ✅ `{"configured":false}`; POST returns 503; UI shows "LLM not configured" |
| LLM route with a key (mock OpenAI-compatible server) | `scripts/mock-llm.mjs` plus Playwright | ✅ Request sent with `temperature: 0` and bearer auth; narrative rendered with "Written by mock-model…" label |
| LLM provider unreachable | Same setup with the mock stopped | ✅ API returns 502; UI shows "Could not reach the LLM provider. The rule-based explanation above remains accurate." |
| Responsive rendering | Screenshots at 1440px and 390px (`scripts/shoot.mjs`) | ✅ Reviewed landing, optimizer and dashboard; fixed mobile header wrapping and moved optimizer results above the constraint panel on small screens |

## Engine unit tests (`src/lib/engine/allocate.test.ts`)

All passing:

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

## End-to-end journey (`scripts/e2e.mjs`): 23/23 passed

Run against `next start` (production build):

```
PASS  Landing page shows hero headline
PASS  Try Live Demo opens Harbour Valley Farm listing (2 ac / 1.5 ac)
PASS  Find Compatible Growers navigates to optimizer
PASS  Run Optimization places 4 of 5 growers on 1.50 ac and defers Grower E
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
PASS  Marking a section for discussion and ready-for-review is reflected on dashboard
PASS  Landowner form validates required fields
PASS  Saving a new property makes it the active listing
PASS  Explore Land lists properties including the new one
PASS  Sign-in role picker links to dashboard
PASS  No browser console errors during the journey
```

## Failures found and fixed during testing

- A server component called the client-only `cn()` helper, causing a 500 on `/`. Moved `cn` to `src/lib/cn.ts`.
- `new Date()` during prerender on `/agreements` triggered a Next.js "unstable value" console error. Generated drafts no longer carry a timestamp until saved.
- The dark "Why an organization would subscribe" card on the dashboard rendered blank because a background class conflicted. Fixed.
- On mobile, the logo wrapped onto two lines and the optimizer results sat below the controls. Fixed.
- Early e2e failures were test-selector issues: duplicate "Try Live Demo" links, and Next 16 keeping the previous route mounted but hidden, which gave two `<main>` elements. Selectors are now scoped to visible elements.

## Not tested or remaining limitations

- **No live LLM provider was called.** The integration was tested only against a local mock. The quality of real model output is unverified.
- **No live deployment** was performed from this environment.
- Tested only in headless Chromium. Safari and Firefox were not tested. Print output was not checked on paper, though print CSS is in place.
- Accessibility: keyboard focus styles, ARIA labels and dialog Escape-to-close are implemented, but no formal audit (screen reader, axe) was run.
- `localStorage` persistence is per browser. Clearing site data resets the demo.
- Known remaining bugs: none observed in the tested flows.

## How to reproduce

```bash
npm install
npm run typecheck && npm run lint && npm test && npm run build
npm start &                                   # port 3000
node scripts/e2e.mjs                          # requires Playwright Chromium or CHROME_PATH
```
