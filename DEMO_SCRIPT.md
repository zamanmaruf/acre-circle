# Acre Circle: Two-Minute Demo Script

**Before you start:** open `http://localhost:3000` (or the deployed URL). If anyone has clicked around already, press **Reset demo** in the app header and confirm. The guided-demo bar under the header has **Next** buttons for each step.

---

### 0:00–0:20 · Landing page (`/`)

> "Nova Scotia lost over a fifth of its census farms between 2016 and 2021, and its farmers are the oldest in Canada. Meanwhile new growers can't get affordable land, and some owners have land they can't use. The land exists. The ambition exists. The connection is missing."

- Point to the headline **Unused Land. Unlimited Potential.** and the illustrative two-acre plot card.
- Click **Try Live Demo: Harbour Valley Farm walkthrough**.

### 0:20–0:40 · The listing (`/landowner`)

> "Harbour Valley Farm is a synthetic Annapolis Valley property. It has 2 acres in total: 1.5 acres can be cultivated and 0.5 is reserved for a shared yard and access."

- Show the **Unverified information** card: water is owner-reported, irrigation capacity is not verified, there is no soil test, and ownership is not verified. *"We never assume what hasn't been confirmed."*
- Click **Find Compatible Growers**.

### 0:40–1:00 · The growers (`/optimizer`, with an optional quick look at `/growers`)

> "Five fictional applicants: garlic, specialty vegetables, herbs, a community food project, and an irrigation-heavy market garden. Each has different acreage, budget and water needs."

- Point to the **Applicant requirements** table on the left: minimum and desired acres, and budget.

### 1:00–1:30 · Run the optimizer

- Click **Run Optimization**.

> "The engine checks nine constraints for each grower, then searches every combination of eligible growers. Four fit together: Plots A and B at half an acre each, C and D at a quarter acre each, filling the 1.5 acres exactly. Grower E is *deferred*, not rejected, because its irrigation capacity isn't verified. We won't promise water that hasn't been confirmed."

- Hover a plot in the diagram to show details. Point to the **Match explanation** card and the **Rule-based** label: *"The engine decides. Language AI can only explain, and it's switched off without an API key. We label that honestly."*

### 1:30–1:45 · Change a constraint, live

- Click **Reduce cultivable land to 1.0 ac**. The diagram shows "Inputs changed".
- Click **Recalculate Allocation**.

> "With only one acre, four minimum plots no longer fit, because the owner's minimum plot is a quarter acre. The engine re-searched every combination and now places three growers on exactly 1.0 acre. Open Grower B's card: it's still *eligible*, but among equally productive plans, the one without B leaves fewer things to verify. B asked for a wash station the owner doesn't list, and its water is unverified. Every decision has a reason a coordinator can check."

- Point to the gold **what changed** strip.
- *(Backup what-ifs if a judge asks: **Water becomes unavailable**, where only the self-supplied community project remains on 0.25 ac; **Cut Grower B's budget to $15/mo**, where B becomes not compatible because $15 covers about 0.15 ac against a 0.25 ac minimum; **Irrigation capacity verified**, where E is placed on 0.60 ac and A shrinks to 0.40 ac; **Grower A needs 0.75 ac**, where A grows to 0.60 ac and B shrinks to 0.40 ac.)*
- Click **Restore original inputs**, then **Recalculate Allocation**.

### 1:45–2:00 · Agreement and dashboard

- Click **Next: Agreement** in the guided bar. Show the banner **DRAFT — FOR DISCUSSION AND PROFESSIONAL REVIEW. NOT LEGAL ADVICE.**, the `[TO CONFIRM]` items and the **Missing information** list.
- Click **Next: Dashboard**.

> "This is the paying customer: a land-access organization. It sees every listing, applicant, provisional match and open readiness question, all calculated from the data. It re-plans in seconds instead of starting over on a spreadsheet."

---

## If something goes wrong

- **The page looks odd after earlier clicking:** press **Reset demo**.
- **There's no result on the optimizer:** press **Run Optimization**. Results are never precomputed.
- **The network is down:** the app needs no internet once it is running. Fonts and images are local.
