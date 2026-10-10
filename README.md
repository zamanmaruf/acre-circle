# Acre Circle

**One Land. Endless Possibilities.**

Acre Circle is a prototype B2B SaaS for agricultural land-access organizations in Nova Scotia. Growers find land on a map and request a plot; landowners review requests in an inbox; and a coordinator turns one property into several micro-plots for compatible growers. A deterministic constraint engine proposes the allocation and explains every placement, deferral and rejection. The app then drafts micro-lease terms for professional review.

Built for the Tribe AI Hackathon (Saint Mary's University, Halifax, October 10, 2026).

> All people, properties and organizations in the app are **synthetic**. Nothing in the app is legal, financial or agronomic advice.

---

## The problem

- Nova Scotia had **2,741 census farms in 2021**, a **21.2% decline** from 2016 and the largest drop of any province. Its average farm operator age of **58.2** was the highest in Canada. Source: Statistics Canada, [2021 Census of Agriculture](https://www150.statcan.gc.ca/n1/pub/96-325-x/2021001/article/00003-eng.htm). These are historical figures, not current-year results.
- Aspiring growers (new farmers, market gardeners, community food groups) often need only 0.25–1 acre, on a small monthly budget.
- Some landowners have space they can't farm or maintain, but no low-risk way to share part of it.
- Land-access coordinators match the two by hand. The hard part is fitting **several** growers onto **one** property within real constraints: area, budgets, water, access, permitted uses and shared facilities. Every change means redoing that puzzle.

## The solution

The landing page asks one question: **I want to grow**, **I have land**, or **I run a program**. Each answer sets a role, a trimmed navigation and a short guided path.

1. **Explore land (growers).** A real map of Nova Scotia with approximate pins for each listing. Selecting a listing opens a panel with its facts and a **fit check** for the acting grower. The fit check runs the same engine as the optimizer, so the map never disagrees with the plan. A dashed circle shows the grower's travel range.
2. **Request a plot.** The grower picks an area within the owner's plot range and writes a short note. **My requests** tracks each request through sent, viewed by owner, and accepted or declined.
3. **Landowner inbox.** Requests arrive with the grower's profile, message and fit checks. Accepting makes the grower an applicant for the optimizer. Declining requires a reason that the grower sees. Both actions can be undone, and both notify the other side through the bell in the header.
4. **List land.** The owner records area, cultivable and reserved acreage, water status (verified, owner-reported, unknown or none), access, permitted activities, plot limits and rent, and drops an approximate pin on a map.
5. **Cooperative plot optimizer.** A constraint search proposes a multi-grower plot plan and draws it to scale. Plans animate from one to the next, and clicking a plot opens its details. Every decision is explained.
6. **Agreement drafts.** Structured micro-lease terms for each match, with unverified items marked `[TO CONFIRM]`, sections flaggable for discussion, and HTML download or print.
7. **Organization dashboard.** Listings, applicants, the plot-request pipeline, provisional matches, acres proposed, agreements in review and open readiness questions. Every figure is computed from the dataset.

Press **⌘K / Ctrl+K** anywhere for a command palette that jumps to pages and listings, switches role, or resets the demo.

**Proposed buyer:** the organization running a land-access program (nonprofits, cooperatives, university farm programs). Landowners and growers would join free. This business model is a proposal; it has not been validated with customers.

---

## Tech stack

- Next.js 16 (App Router, Turbopack) with React 19 and TypeScript (strict)
- Tailwind CSS v4 with a design-token theme in `src/app/globals.css`
- Lucide icons and Zod for form and API validation
- `motion` for animation, using Material 3 motion tokens (`src/lib/motion.ts`). Route changes use React's `ViewTransition`. All motion respects the operating system's reduce-motion setting.
- MapLibre GL JS with free [OpenFreeMap](https://openfreemap.org) vector tiles (OpenStreetMap data), restyled to the brand palette
- Self-hosted fonts (DM Sans and Playfair Display via Fontsource), so no font CDN is needed at runtime
- Persistence: browser `localStorage`, with a **Reset demo** button
- Tests: Vitest (engine, request and schema unit tests) and Playwright-core (end-to-end journey script)

No database, no paid services and no API keys are required.

### Maps

- **Provider:** OpenFreeMap's `liberty` style (`https://tiles.openfreemap.org/styles/liberty`). It needs no API key. Attribution to OpenFreeMap and OpenStreetMap contributors is shown on the map and under the Explore map.
- **Internet:** map tiles are the only part of the app that needs internet. Offline, or if WebGL is unavailable, each map shows a "Map tiles need an internet connection" fallback. The listing list, property panel, fit checks and requests keep working.
- **Worker file:** MapLibre's web worker is copied from `node_modules` into `public/vendor/` by `scripts/copy-maplibre-worker.mjs`. This runs automatically before `npm run dev` and `npm run build`. The folder is gitignored.
- **Pins are approximate.** Coordinates are fictional pins near each listing's region. The engine still uses rounded region-to-region distances, not the map.

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000
```

Other commands:

```bash
npm test               # unit tests (Vitest)
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run build && npm start
node scripts/e2e.mjs   # end-to-end journey test against a running app
node scripts/map-debug.mjs /explore   # map status, pin count and a screenshot in .screenshots/
```

`scripts/e2e.mjs`, `scripts/shoot.mjs` and `scripts/map-debug.mjs` use `playwright-core`. If Playwright's browser isn't installed, run `npx playwright install chromium`, or set `CHROME_PATH` to a Chromium or Chrome binary. The scripts launch Chromium with software WebGL (SwiftShader) so maps can render headless. The e2e passes whether or not the tiles load, and one check blocks the tile server on purpose to test the fallback.

## Environment variables (all optional)

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
| --- | --- |
| `LLM_API_KEY` (or `OPENAI_API_KEY`) | Enables the optional AI narrative. Read only on the server. |
| `LLM_BASE_URL` | Any OpenAI-compatible endpoint. Default: `https://api.openai.com/v1`. |
| `LLM_MODEL` | Default: `gpt-4o-mini`. |

Without a key, the UI says **"LLM not configured"** and shows only rule-based explanations. It never claims live generative AI.

---

## Architecture

```
src/
  lib/
    engine/allocate.ts      ← deterministic constraint screening + exhaustive combination search
    engine/explain.ts       ← structured "facts" + template (rule-based) explanations
    engine/regions.ts       ← approximate region-to-region distances (coarse travel filter)
    engine/fingerprint.ts   ← stable JSON + FNV-1a input fingerprint (reproducibility)
    engine/allocate.test.ts ← 16 unit tests
    fit.ts                  ← per-grower fit badge = single-candidate engine run
    requests.ts             ← pure plot-request transitions (sent → viewed → accepted | declined)
    seed.ts                 ← synthetic Harbour Valley Farm + 6 growers, 5 listings, 1 pending request
    agreement.ts            ← draft generator, missing-info detection, HTML export
    store.tsx               ← React context: role, requests, notifications, undo, localStorage, reset
    schemas.ts              ← Zod validation (forms, Nova Scotia pin bounds, request form)
    motion.ts               ← Material 3 durations, easings and springs
  app/
    (marketing)/page.tsx    ← landing page (role cards, live mini plan, map teaser)
    (app)/explore           ← map + listings + property panel (bottom sheet on mobile)
    (app)/requests|inbox    ← grower request tracking, landowner inbox
    (app)/landowner|growers|optimizer|agreements|dashboard
    (app)/template.tsx      ← route view transitions
    opengraph-image.tsx     ← social preview image (next/og)
    signin/                 ← demo role picker (no auth)
    api/explain/route.ts    ← optional server-side LLM narrative (facts-only prompt)
  components/
    land-map.tsx            ← MapLibre map, pin picker, mini map, offline fallback
    plot-map.tsx            ← animated SVG plot plan with selection and table view
    command-palette.tsx     ← ⌘K / Ctrl+K palette
    motion.tsx, toast.tsx   ← Reveal/CountUp helpers, snackbar with undo
    …                       ← UI kit, explanation panel, request dialog and timeline
```

### The allocation engine (`src/lib/engine/allocate.ts`)

The engine keeps decisions separate from the UI and never uses hard-coded results.

1. **Screening.** Each applicant is checked against hard constraints: permitted activity, season, vehicle access, approximate travel distance, water, plot-size limits, budget at the owner's rate, and cultivable area. Shared-facility gaps are soft warnings. The outcome is one of:
   - **rejected**: a hard constraint fails
   - **deferred**: essential infrastructure is unverified. For example, irrigation capacity is not verified for an irrigation-dependent grower, or water status is unknown for a grower who needs water. The engine never promises unconfirmed resources.
   - **eligible**: passes; any warnings (such as owner-reported water) become open issues
2. **Search.** The engine enumerates **every** subset of eligible applicants (2ⁿ, capped at 16 candidates). It enforces total cultivable area, the owner's maximum number of growers, each grower's min/max plot (in 0.05-acre steps), and growing-practice compatibility (certified-organic and conventional growers are never placed together).
3. **Sizing.** For a fixed group, capacity is distributed above each minimum by water-filling, which maximizes the smallest share of requested area.
4. **Objective (lexicographic).** Maximize placements, then total acres allocated, then minimize unresolved issues, then maximize the least-served grower's share. Remaining ties are broken by grower ID, which is deterministic.
5. **Explanations.** Every placed, not-placed, deferred and rejected applicant gets a reason. Not-placed applicants are compared against the best plan that *does* include them.
6. **Reproducibility.** Area math uses integer hundredths of an acre. Each result carries an input fingerprint and engine version, so the same inputs always produce the same plan.

Because the search is exhaustive and sizing is exact for a fixed group, the plan is **optimal for this objective and this simplified model**. That is not a claim about real-world suitability.

### AI explanation layer

- **Default:** template-generated explanations built only from engine output, labelled "Rule-based".
- **Optional:** `/api/explain` sends only the structured facts to an OpenAI-compatible model (temperature 0). The system prompt forbids inventing ownership, soil, yields, revenue, legal status, verified water or customers. The output is labelled with the model name and a note to verify it. The route validates input with Zod, rate-limits requests in memory and times out after 20 seconds. Failures fall back to the rule-based explanation.

---

## What's implemented and what's simulated

**Implemented and working**

- Landing page with role cards, a live mini plan that cycles through real engine runs, a map teaser and a "Try Live Demo" entry
- Role switcher (grower, landowner, program) with a role-specific navigation and guided path
- Explore map with branded pins, list/map hover sync, fly-to selection, region filters, travel radius and fit badges, plus a draggable bottom sheet on mobile
- Plot requests end to end: request dialog, My requests timeline, landowner inbox with accept/decline (reason required), undo, notifications and a dashboard pipeline
- Command palette (⌘K / Ctrl+K), skeletons while saved data loads, per-route titles and a generated Open Graph image
- Landowner listing form (validated) with a map pin picker, results screen, save/edit, multiple properties
- Grower marketplace with live eligibility, search/filter, create and edit profiles
- Cooperative plot optimizer: results first, what-if chips, a collapsible constraints panel (a sheet on mobile), Recalculate, animated run-to-run diff and counters, a to-scale SVG plan that morphs between runs, a click-to-select plot panel, a table view, and an allocation-details modal (constraint matrix, alternatives, assumptions, open issues)
- Rule-based explanation engine, plus an optional LLM narrative when a key is configured
- Agreement drafts: edit, flag for discussion, missing-info list, mark ready for review, download HTML, print
- Organization dashboard with derived KPIs, coordinator workflow checklist, readiness questions and demo measurements
- Guided demo stepper, Reset demo, demo sign-in role picker, 404 page

**Simulated, stubbed or not included**

- **Authentication:** the role picker is demo-only. No accounts, no role-based access control.
- **Persistence:** browser `localStorage` only. No server database and no multi-user sync.
- **Requests and notifications:** they live in one browser. You play both the grower and the landowner by switching roles. There's no email, messaging or real-time delivery, and in the demo the landowner owns every listing.
- **Geography:** pins are approximate and there's no geocoding or address search. Engine distances are rounded region-to-region estimates, and the travel circle is drawn from a region centre. The plot diagram is schematic, with areas to scale relative to each other, and is not a surveyed boundary.
- **Verification:** water, soil, ownership and acreage are recorded as reported. Nothing is verified by the app.
- **Agreements:** structured drafts only. No e-signature, no legal review, no payments.
- **LLM:** off unless you provide a key. It was not exercised against a live provider during the hackathon build (see `TEST_RESULTS.md`).

## Known limitations

- Exhaustive search is exact but exponential; it is capped at 16 eligible applicants per property.
- The model is simplified. It does not consider plot adjacency, sun or slope, crop rotation, multi-season planning or soil.
- Rent is a single per-acre monthly rate; real deals vary.
- The demo is single-user; data lives in one browser.

## Demo instructions

See [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md). Short version: Home → **Try Live Demo** → **Find Compatible Growers** → **Run Optimization** → click **Reduce cultivable land to 1.0 ac** → **Recalculate Allocation** → Agreements → Dashboard. For the marketplace loop: **I want to grow** → Harbour Valley Farm → **Request a plot** → switch to **Landowner** → Inbox → **Accept as applicant** → **Open in plot optimizer**.

## Deploying to Vercel

No live deployment was made from this environment. To deploy:

1. Push this folder to a GitHub repository.
2. In Vercel, choose **New Project**, import the repo, and keep the Next.js defaults (build `next build`, output `.next`).
3. Optionally add `LLM_API_KEY`, `LLM_BASE_URL` and `LLM_MODEL` under Project → Settings → Environment Variables.
4. Deploy. No database or other services are needed.

Alternatively, run `npx vercel` from this folder after `npx vercel login`.

## Credits

Photography from [Unsplash](https://unsplash.com) (Unsplash License).
