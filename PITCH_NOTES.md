# Acre Circle: Pitch Notes

## Idea snapshot (≤100 words, due 11:30 a.m.)

> **Acre Circle: One Land. Endless Possibilities.** Nova Scotia lost 21.2% of its census farms between 2016 and 2021, and its farm operators are the oldest in Canada (Statistics Canada, 2021 Census of Agriculture). Meanwhile, aspiring growers can't access affordable land, and some landowners have space they can't use. Acre Circle is B2B coordination software for land-access organizations. Its constraint-based optimizer divides one property into several micro-plots for compatible growers, checking acreage, budgets, water, access and permitted uses. It explains every decision, flags unverified infrastructure and drafts micro-lease terms for professional review.

(98 words)

---

## Round 1: three-minute pitch (Problem 50%, Solution 50%)

**Suggested slides (2–5):** 1. Problem · 2. Who feels it · 3. Solution and optimizer screenshot · 4. Who pays and why it's AI · 5. Ask

**[0:00–0:30] Hook and problem**
"Between 2016 and 2021, Nova Scotia lost 21.2% of its census farms, the steepest decline of any province. Our farm operators are also the oldest in Canada, averaging 58.2 years. That's Statistics Canada's 2021 Census of Agriculture. Who will farm next, and on what land?"

**[0:30–1:15] Who experiences it**
"Three groups. *Aspiring growers*, such as new farmers, market gardeners and community food projects, often need just a quarter acre to an acre, on a monthly budget, and can't get it. *Landowners* may have open land they can't farm, but leasing a whole field to a stranger feels risky. And the *organizations* that run land-access programs coordinate both sides with spreadsheets and phone calls. The land exists and the ambition exists. The connection is missing."

**[1:15–2:15] Solution**
"Acre Circle is coordination software for those organizations. Its core is a cooperative plot optimizer. Take one property, say two acres with 1.5 cultivable. The engine checks every applicant against acreage, budget, water, access, season and permitted uses, then searches every combination to place *several* compatible growers on one property. It shows the plan as a to-scale diagram, explains each placement, and defers anyone whose essential infrastructure, like irrigation, isn't verified, instead of promising it. Change one constraint and it re-plans in milliseconds. Then it drafts micro-lease terms with every open question flagged for professional review."

**[2:15–2:45] Why this is different and who pays**
"Farm-matching sites connect one owner to one tenant. We solve the harder problem: how one property becomes several farming opportunities. The buyer is the land-access organization, on a subscription. Landowners and growers join free."

**[2:45–3:00] Close**
"We have a working prototype today. One land, endless possibilities."

---

## Final round: five-minute pitch built around the prototype

| Time | Say | Show |
| --- | --- | --- |
| 0:00–0:40 | Problem and Nova Scotia stats (as in Round 1, compressed). | Landing hero, then scroll to the Impact section with the cited StatCan figures. |
| 0:40–1:10 | "Meet Harbour Valley Farm, a synthetic two-acre listing: 1.5 cultivable, 0.5 shared. Notice what we *don't* know: water is owner-reported, irrigation and soil unverified." | `/landowner`: Property facts card, "To confirm" tags. |
| 1:10–1:30 | "Five fictional applicants with different needs." | `/growers` cards, or the applicant table on the optimizer. |
| 1:30–2:30 | Run Optimization. "Four growers fit 1.5 acres exactly. Grower E is deferred because irrigation isn't verified. We never promise water. Every placement has a reason; here's the constraint matrix." | `/optimizer`: Run, hover a plot, open View Allocation Details. |
| 2:30–3:15 | "Now the owner says only one acre is available." Click the what-if, then Recalculate. "Three growers, re-searched in milliseconds, with the reason B was left out." | The what-changed strip and Grower B's card. |
| 3:15–3:45 | "Each match becomes a draft agreement, clearly not legal advice, with missing information listed." | `/agreements`: banner, "To confirm" chips, sections-to-confirm progress. |
| 3:45–4:30 | "This is the customer's view: an agricultural cooperative's workspace. Listings, applicants, matches, open readiness questions, all calculated from data. Coordinators re-plan in seconds instead of redoing a spreadsheet." | `/dashboard`. |
| 4:30–5:00 | Impact plan and ask: "We'd measure coordination time per placement, match-to-agreement rate and acres actually cultivated, in a pilot with one Nova Scotia land-access organization this season." | Dashboard demo measurements and the landing pilot metrics. |

**Execution and innovation talking points**

- Exhaustive constraint search over every combination of eligible growers, with exact plot sizing. The plan is provably optimal *for our stated objective and simplified model*.
- Deterministic and reproducible: same inputs, same plan, plus an input fingerprint on every run.
- "Deferred, not promised": unverified infrastructure is a first-class state, not a footnote.
- The AI layer is honest. The engine decides; an optional LLM only rewrites structured facts, and it is labelled as off when no key is set.
- 16 engine unit tests and a 23-step automated browser journey test (see `TEST_RESULTS.md`).

---

## Likely judge questions and honest answers

**"Where's the AI? Isn't this just rules?"**
The core is constraint-based optimization: combinatorial search with an explicit objective. That's classic AI, chosen deliberately because land decisions must be auditable and reproducible. Generative AI is used only where it's safe: turning the engine's structured output into plain language. In the demo it's switched off unless an API key is configured, and the UI says so. Next steps for ML include extracting structured listings from free-text owner descriptions and learning which matches progress to agreements.

**"Is the allocation optimal?"**
For our objective (placements, then acres, then fewer open issues, then fairness) and our simplified model, yes. We enumerate every combination of eligible growers and size plots exactly. We don't claim real-world optimality: the model ignores plot shape, sun, slope and adjacency.

**"How do you know the land or the water is real?"**
We don't, and the product says so. Ownership, acreage, soil and water are recorded as reported and flagged as unverified. Growers who depend on unverified infrastructure are *deferred*. Verification would be a coordinator workflow step, such as a site visit or water test.

**"Are the agreements legally valid?"**
No. They're structured drafts for discussion, marked "NOT LEGAL ADVICE", with every unconfirmed item flagged. They help parties arrive at a lawyer or advisor better prepared.

**"Who pays, and how much?"**
Land-access organizations: nonprofits, cooperatives and university programs. Our hypothesis is a per-organization subscription, with landowners and growers free. We haven't validated pricing or signed customers. Our next step is a pilot with one organization to measure coordination time saved.

**"What about existing farmland-matching platforms?"**
Farmland-matching and land-linking services already exist in Canada, North America and Europe. They mostly do listings and one-to-one matching, often with excellent human facilitation. We're not replacing that facilitation. We give facilitators a tool for the harder case: multi-grower allocation on one property, with explicit constraints, deferrals and drafts. That could complement existing programs rather than compete with them. We haven't done a full competitive audit, so we'd frame this as positioning, not a claim of being first.

**"Why Nova Scotia?"**
It had the largest provincial drop in farm count from 2016 to 2021 (−21.2%) and the oldest average farm operator age in Canada (58.2). Small-plot, cooperative models fit local realities: small parcels, community food projects and new-entrant growers.

**"What data do you collect? Privacy?"**
The prototype stores everything in the user's browser and uses only synthetic data. In production we'd collect the minimum needed to match: no sensitive personal data, and approximate locations only until parties agree to share more.

**"What did you actually build today vs. what's mocked?"**
Working: the listing and grower forms, live eligibility, the optimizer with what-ifs and recalculation, the diagram, explanations, agreement drafts with download and print, the dashboard and reset. Simulated: authentication (role picker only), server persistence (localStorage), geocoding and maps (the schematic diagram), and any verification. The LLM narrative is implemented but not exercised against a live provider in our tests.

**"What happens with 100 growers?"**
Exhaustive search is capped at 16 eligible applicants per property. Beyond that we'd switch to integer programming or branch-and-bound with pruning. A coordinator would also pre-filter by property interest, which keeps candidate sets small in practice.

---

## Honest competitive positioning

| | Typical land-linking or listing platforms | Acre Circle (prototype) |
| --- | --- | --- |
| Core unit | One property ↔ one farmer | One property ↔ several compatible growers |
| Matching | Search filters and human facilitation | Constraint screening plus exhaustive multi-grower allocation with reasons |
| Uncertainty | Varies | Unverified infrastructure is an explicit "deferred" state |
| Agreements | Templates or referrals | Match-specific drafts with flagged unknowns (not legal advice) |
| Buyer | Often grant-funded programs | Subscription for the organizations running programs (hypothesis) |

We see facilitators at existing programs as potential **customers and partners**, not just competitors.
