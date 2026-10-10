# Acre Circle: Demo Script

**Before you start:** open `http://localhost:3000` (or the deployed URL). If anyone has clicked around already, press **Reset demo** in the app header and confirm (or press **⌘K / Ctrl+K** and choose **Reset demo data**). Each role has a guided bar under the header with **Next** buttons.

There are two paths. The **two-minute path** is the coordinator story judges need. The **marketplace loop** adds about a minute and shows growers and landowners using the product themselves.

---

## Two-minute path (program coordinator)

### 0:00–0:20 · Landing page (`/`)

> "Nova Scotia lost over a fifth of its census farms between 2016 and 2021, and its farmers are the oldest in Canada. Meanwhile new growers can't get affordable land, and some owners have land they can't use. The land exists. The ambition exists. The connection is missing."

- Point to the headline **Unused Land. Unlimited Potential.** and the three role cards: *"Everyone starts with one question: what brings you here?"*
- The card on the right is the **live engine**. It cycles through real runs (base plan, a new grower accepted, land reduced to 1 acre). Hover it to pause.
- Click **Try Live Demo: Harbour Valley Farm walkthrough**.

### 0:20–0:40 · The listing (`/landowner`)

> "Harbour Valley Farm is a synthetic Annapolis Valley property. It has 2 acres in total: 1.5 acres can be cultivated and 0.5 is reserved for a shared yard and access."

- Show the small location map and the **Unverified information** card: water is owner-reported, irrigation capacity is not verified, there is no soil test, and ownership is not verified. *"We never assume what hasn't been confirmed."*
- Click **Find Compatible Growers**.

### 0:40–1:00 · The optimizer (`/optimizer`)

> "Five fictional applicants: garlic, specialty vegetables, herbs, a community food project, and an irrigation-heavy market garden. Each has different acreage, budget and water needs."

- Point to the **Applicant requirements** table in the constraints panel on the right.

### 1:00–1:30 · Run the optimizer

- Click **Run Optimization**. The plots grow into place and the counters tick up.

> "The engine checks nine constraints for each grower, then searches every combination of eligible growers. Four fit together: Plots A and B at half an acre each, C and D at a quarter acre each, filling the 1.5 acres exactly. Grower E is *deferred*, not rejected, because its irrigation capacity isn't verified. We won't promise water that hasn't been confirmed."

- **Click Plot B** in the diagram. The panel beside it shows the grower, area, rent, how much of their request is met, and what still needs confirming.
- Point to the **Match explanation** card and its **Rule-based** label: *"The engine decides. Language AI can only explain, and it's switched off without an API key. We label that honestly."*

### 1:30–1:45 · Change a constraint, live

- In the **What if…** row, click **Reduce cultivable land to 1.0 ac**. A note says "Inputs changed".
- Click **Recalculate Allocation**. The plan morphs to the new layout.

> "With only one acre, four minimum plots no longer fit, because the owner's minimum plot is a quarter acre. The engine re-searched every combination and now places three growers on exactly 1.0 acre. Grower B is still *eligible*, but among equally productive plans, the one without B leaves fewer things to verify. Every decision has a reason a coordinator can check."

- Point to the gold **what changed** strip.
- *(Backup what-ifs if a judge asks: **Water becomes unavailable**, where only the self-supplied community project remains on 0.25 ac; **Cut Grower B's budget to $15/mo**, where B becomes not compatible because $15 covers about 0.15 ac against a 0.25 ac minimum; **Irrigation capacity verified**, where E is placed on 0.60 ac and A shrinks to 0.40 ac; **Grower A needs 0.75 ac**, where A grows to 0.60 ac and B shrinks to 0.40 ac.)*
- Click **Restore original inputs**, then **Recalculate Allocation**.

### 1:45–2:00 · Agreement and dashboard

- Click **Next: Agreement** in the guided bar. Show the banner **DRAFT — FOR DISCUSSION AND PROFESSIONAL REVIEW. NOT LEGAL ADVICE.**, the `[TO CONFIRM]` items and the **Missing information** list.
- Click **Next: Dashboard**.

> "This is the paying customer: a land-access organization. It sees every listing, applicant, plot request, provisional match and open readiness question, all calculated from the data. It re-plans in seconds instead of starting over on a spreadsheet."

---

## Marketplace loop (about 60 seconds)

### Grower: find land and request a plot

- In the header, switch **View as → Grower** (or start from the **I want to grow** card on the home page). You land on **Explore Land** as *Maple Hollow Flowers*, a first-year cut-flower grower.
- Point to the fit badges: *"Only Harbour Valley is a good fit. The others fail at least one hard constraint, such as travel distance. The badge comes from the same engine as the optimizer."* The dashed circle on the map is the grower's 35 km travel range.
- Click **Harbour Valley Farm**. The map flies to the pin and the panel slides in with fit checks, worst first.
- Click **Request a plot**, keep 0.25 ac, and click **Send request**. A snackbar confirms, with **Undo**.

### Landowner: review and accept

- Switch **View as → Landowner**. The listing shows **1 grower request waiting**, and the bell shows a badge.
- Open **Inbox** and select **Maple Hollow Flowers**. Point to the fit checks: *"The owner sees exactly why this grower fits."*
- Click **Accept as applicant**, then **Open in plot optimizer** and **Recalculate Allocation**. Six applicants are now evaluated and Maple Hollow Flowers gets a plot.
- *(Optional: select **Salt & Thyme Herbs**, click **Decline**, and show that a reason is required.)*

### Grower: the reply arrives

- Switch back to **Grower**. The bell shows the acceptance. **My Requests** shows the timeline: Sent, Viewed by owner, Accepted.

---

## If something goes wrong

- **The page looks odd after earlier clicking:** press **Reset demo**.
- **There's no result on the optimizer:** press **Run Optimization**. Results are never precomputed.
- **The network is down:** only the map tiles need internet. Each map shows a "Map tiles need an internet connection" card, and everything else works: listings, fit checks, requests, the optimizer, agreements and the dashboard. Fonts and images are local.
- **A request button is disabled:** the acting grower isn't a fit for that listing. Switch the acting grower, or pick Harbour Valley Farm.
