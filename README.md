# Acre Circle

**One Land. Endless Possibilities.**

Acre Circle is a prototype B2B SaaS for agricultural land-access organizations in Nova Scotia. It helps a coordinator turn one available property into several micro-plots for compatible growers. A deterministic constraint engine proposes the allocation and explains every placement, deferral and rejection. The app then drafts micro-lease terms for professional review.

Built for the Tribe AI Hackathon (Saint Mary's University, Halifax, October 10, 2026).

> All people, properties and organizations in the app are **synthetic**. Nothing in the app is legal, financial or agronomic advice.

---

## The problem

- Nova Scotia had **2,741 census farms in 2021**, a **21.2% decline** from 2016 and the largest drop of any province. Its average farm operator age of **58.2** was the highest in Canada. Source: Statistics Canada, [2021 Census of Agriculture](https://www150.statcan.gc.ca/n1/pub/96-325-x/2021001/article/00003-eng.htm). These are historical figures, not current-year results.
- Aspiring growers (new farmers, market gardeners, community food groups) often need only 0.25–1 acre, on a small monthly budget.
- Some landowners have space they can't farm or maintain, but no low-risk way to share part of it.
- Land-access coordinators match the two by hand. The hard part is fitting **several** growers onto **one** property within real constraints: area, budgets, water, access, permitted uses and shared facilities. Every change means redoing that puzzle.

## The solution

1. **List land.** The owner records area, cultivable and reserved acreage, water status (verified, owner-reported, unknown or none), access, permitted activities, plot limits and rent.
2. **Grower profiles.** Each grower records crop, minimum and desired acreage, budget, water, vehicle and season needs, and equipment needs.
3. **Cooperative plot optimizer.** A constraint search proposes a multi-grower plot plan, draws it to scale, and explains each decision.
4. **Agreement drafts.** Structured micro-lease terms for each match, with unverified items marked `[TO CONFIRM]`, sections flaggable for discussion, and HTML download or print.
5. **Organization dashboard.** Listings, applicants, provisional matches, acres proposed, agreements in review and open readiness questions. Every figure is computed from the dataset.

**Proposed buyer:** the organization running a land-access program (nonprofits, cooperatives, university farm programs). Landowners and growers would join free. This business model is a proposal; it has not been validated with customers.

---

## Tech stack

- Next.js 16 (App Router, Turbopack) with React 19 and TypeScript (strict)
- Tailwind CSS v4 with a design-token theme in `src/app/globals.css`
- Lucide icons, `motion` for diagram animation, Zod for form and API validation
- Self-hosted fonts (DM Sans and Playfair Display via Fontsource), so no font CDN is needed at runtime
- Persistence: browser `localStorage`, with a **Reset demo** button
- Tests: Vitest (engine unit tests) and Playwright-core (end-to-end journey script)

No database, no paid services and no API keys are required.

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000
```

Other commands:

```bash
npm test               # engine unit tests (Vitest)
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run build && npm start
node scripts/e2e.mjs   # end-to-end journey test against a running app
```

`scripts/e2e.mjs` and `scripts/shoot.mjs` use `playwright-core`. If Playwright's browser isn't installed, run `npx playwright install chromium`, or set `CHROME_PATH` to a Chromium or Chrome binary.

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
    seed.ts                 ← synthetic Harbour Valley Farm + 5 growers (+2 extra listings)
    agreement.ts            ← draft generator, missing-info detection, HTML export
    store.tsx               ← React context + localStorage persistence + reset
    schemas.ts              ← Zod form validation
  app/
    (marketing)/page.tsx    ← landing page
    (app)/landowner|growers|optimizer|agreements|dashboard|explore
    signin/                 ← demo role picker (no auth)
    api/explain/route.ts    ← optional server-side LLM narrative (facts-only prompt)
  components/               ← UI kit, plot diagram (SVG), explanation panel, etc.
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

- Landing page with all sections, CTAs and a "Try Live Demo" entry
- Landowner listing form (validated), results screen, save/edit, multiple properties
- Grower marketplace with live eligibility, search/filter, create and edit profiles
- Cooperative plot optimizer: one-click what-if scenarios, editable constraints, Recalculate, run-to-run diff, animated to-scale SVG diagram with hover details, allocation-details modal (constraint matrix, alternatives, assumptions, open issues)
- Rule-based explanation engine, plus an optional LLM narrative when a key is configured
- Agreement drafts: edit, flag for discussion, missing-info list, mark ready for review, download HTML, print
- Organization dashboard with derived KPIs, coordinator workflow checklist, readiness questions and demo measurements
- Guided demo stepper, Reset demo, demo sign-in role picker, 404 page

**Simulated, stubbed or not included**

- **Authentication:** the role picker is demo-only. No accounts, no role-based access control.
- **Persistence:** browser `localStorage` only. No server database and no multi-user sync.
- **Geography:** no maps or geocoding. Distances are approximate region-to-region estimates. The plot diagram is schematic, with areas to scale relative to each other, and is not a surveyed boundary.
- **Verification:** water, soil, ownership and acreage are recorded as reported. Nothing is verified by the app.
- **Agreements:** structured drafts only. No e-signature, no legal review, no payments.
- **LLM:** off unless you provide a key. It was not exercised against a live provider during the hackathon build (see `TEST_RESULTS.md`).

## Known limitations

- Exhaustive search is exact but exponential; it is capped at 16 eligible applicants per property.
- The model is simplified. It does not consider plot adjacency, sun or slope, crop rotation, multi-season planning or soil.
- Rent is a single per-acre monthly rate; real deals vary.
- The demo is single-user; data lives in one browser.

## Demo instructions

See [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md). Short version: Home → **Try Live Demo** → **Find Compatible Growers** → **Run Optimization** → click **Reduce cultivable land to 1.0 ac** → **Recalculate Allocation** → Agreements → Dashboard.

## Deploying to Vercel

No live deployment was made from this environment. To deploy:

1. Push this folder to a GitHub repository.
2. In Vercel, choose **New Project**, import the repo, and keep the Next.js defaults (build `next build`, output `.next`).
3. Optionally add `LLM_API_KEY`, `LLM_BASE_URL` and `LLM_MODEL` under Project → Settings → Environment Variables.
4. Deploy. No database or other services are needed.

Alternatively, run `npx vercel` from this folder after `npx vercel login`.

## Credits

Photography from [Unsplash](https://unsplash.com) (Unsplash License).
