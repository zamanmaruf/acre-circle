// End-to-end demo journey test. Requires the app running (npm run dev or npm start).
// Usage: node scripts/e2e.mjs   (BASE_URL defaults to http://localhost:3000; CHROME_PATH optional)
import { chromium } from "playwright-core";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  // Software WebGL so the map can render in headless runs; the app falls back gracefully without it.
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const consoleErrors = [];
// Map tiles come from a third-party CDN; failures there are handled by the in-app fallback, not app errors.
const isTileNoise = (url = "") => /openfreemap\.org|openstreetmap\.org/.test(url);
const trackErrors = (p, sink) => {
  p.on("console", (m) => m.type() === "error" && !isTileNoise(m.location()?.url) && sink.push(m.text()));
  p.on("pageerror", (e) => sink.push(e.message));
};
trackErrors(page, consoleErrors);

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`FAIL  ${name}\n      ${e.message.split("\n")[0]}`);
  }
}
// Polls because numbers animate (CountUp) and lists hydrate from localStorage after first paint.
const expectText = async (locator, re, timeout = 8000) => {
  await locator.first().waitFor({ timeout });
  const deadline = Date.now() + timeout;
  let text = "";
  while (Date.now() < deadline) {
    text = await locator.first().innerText();
    if (re.test(text)) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`Expected ${re} in: ${text.slice(0, 200)}`);
};
const stats = () => page.getByTestId("result-stats");
const scenario = (label) => page.getByRole("button", { name: label }).click();
const recalc = () => page.getByTestId("run-optimizer").click();
const restore = () => page.getByRole("button", { name: "Restore original inputs" }).click();

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

await check("Landing page shows hero headline", async () => {
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await expectText(page.locator("h1"), /Unused Land\.\s*Unlimited Potential\./);
});

await check("Try Live Demo opens Harbour Valley Farm listing (2 ac / 1.5 ac)", async () => {
  await page.getByRole("link", { name: /Try Live Demo/ }).first().click();
  await page.waitForURL(/\/landowner/);
  await expectText(page.locator("h1"), /Harbour Valley Farm/);
  await expectText(page.locator("main:visible"), /2\.00 ac[\s\S]*1\.50 ac[\s\S]*0\.50 ac/);
});

await check("Find Compatible Growers navigates to optimizer", async () => {
  await page.getByTestId("find-growers").click();
  await page.waitForURL(/\/optimizer/);
});

await check("Run Optimization places 4 of 5 growers on 1.50 ac and defers Grower E", async () => {
  await recalc();
  await expectText(stats(), /4 \/ 5[\s\S]*1\.50/);
  await expectText(page.locator("main:visible"), /Grower E[\s\S]*Deferred/);
});

await check("Clicking a plot opens its details panel; clearing returns to the plot list", async () => {
  await page.locator("main:visible").locator('[data-plot="grower-b"]').click();
  await expectText(page.getByTestId("plot-panel"), /Plot B · Grower B[\s\S]*Fundy Specialty Greens[\s\S]*0\.50 ac/);
  await page.getByRole("button", { name: "Clear plot selection" }).click();
  await expectText(page.getByTestId("plot-panel"), /Select a plot/);
});

await check("Plot sizes are 0.50 / 0.50 / 0.25 / 0.25 ac", async () => {
  const legend = await page.locator("main:visible").innerText();
  for (const re of [/Plot A · Grower A · 0\.50 ac/, /Plot B · Grower B · 0\.50 ac/, /Plot C · Grower C · 0\.25 ac/, /Plot D · Grower D · 0\.25 ac/]) {
    if (!re.test(legend)) throw new Error(`Missing ${re}`);
  }
});

await check("Explanation is labelled rule-based when no LLM key is set", async () => {
  await page.locator("main:visible").getByRole("tab", { name: "Why this plan" }).click();
  await expectText(page.locator("main:visible"), /Rule-based · generated from engine output/);
  await expectText(page.locator("main:visible"), /LLM not configured|LLM connected/);
  await page.locator("main:visible").getByRole("tab", { name: /Before signing/ }).click();
  await expectText(page.locator("main:visible"), /Confirm before anyone signs[\s\S]*Growers A, B and C/);
  await page.locator("main:visible").getByRole("tab", { name: /Applicants/ }).click();
});

await check("Reduce land to 1.0 ac → stale warning → recalculation drops to 3 placements within 1.00 ac", async () => {
  await scenario("Reduce cultivable land to 1.0 ac");
  await expectText(page.locator("main:visible"), /Inputs changed/);
  await recalc();
  await expectText(stats(), /3 \/ 5[\s\S]*Acres allocated\s*1\.00/);
  const t = await stats().innerText();
  const allocated = Number(t.match(/Acres allocated\s*([\d.]+)/)[1]);
  if (allocated > 1.0001) throw new Error(`Allocated ${allocated} > 1.00`);
  await page.getByTestId("run-diff").waitFor({ timeout: 5000 });
});

await check("Water unavailable → only the self-supplied community project is placed", async () => {
  await restore();
  await scenario("Water becomes unavailable");
  await recalc();
  await expectText(stats(), /1 \/ 5/);
  await expectText(page.locator("main:visible"), /Grower D[\s\S]*Placed/);
});

await check("Budget cut to $15/mo → Grower B not compatible", async () => {
  await restore();
  await scenario("Cut Grower B's budget to $15/mo");
  await recalc();
  await expectText(page.locator("main:visible"), /Grower B\s*Not compatible/);
});

await check("Prohibit herbs → Grower C not compatible", async () => {
  await restore();
  await scenario("Owner prohibits culinary herbs");
  await recalc();
  await expectText(page.locator("main:visible"), /Grower C\s*Not compatible/);
});

await check("Verify irrigation → Grower E no longer deferred, total still ≤ 1.50 ac", async () => {
  await restore();
  await scenario("Irrigation capacity verified");
  await recalc();
  const main = await page.locator("main:visible").innerText();
  if (/Grower E\s*Deferred/.test(main)) throw new Error("Grower E still deferred");
  const t = await stats().innerText();
  const allocated = Number(t.match(/Acres allocated\s*([\d.]+)/)[1]);
  if (allocated > 1.5001) throw new Error(`Allocated ${allocated} > 1.50`);
});

await check("Cultivable 0.2 ac → no suitable matches state", async () => {
  await restore();
  const field = page.getByLabel("Cultivable (ac)");
  await field.fill("0.2");
  await recalc();
  await expectText(page.locator("main:visible"), /No suitable matches under the current constraints/);
});

await check("Invalid input (cultivable 1.8 + reserved 0.5 > 2 ac) is rejected, not allocated", async () => {
  await page.getByLabel("Cultivable (ac)").fill("1.8");
  await recalc();
  await expectText(page.locator("main:visible"), /property inputs are inconsistent/);
});

await check("View Allocation Details opens breakdown modal", async () => {
  await restore();
  await recalc();
  await page.getByRole("button", { name: "View Allocation Details" }).click();
  await page.getByText("Constraint matrix", { exact: true }).waitFor();
  await page.getByText("Objective (in priority order):").waitFor();
  await page.keyboard.press("Escape");
});

await check("Editing Grower B's budget on /growers updates eligibility", async () => {
  await page.goto(base + "/growers", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Edit Grower B" }).click();
  const dialog = page.locator("[role=dialog]:visible");
  await dialog.getByLabel("Budget ($/month)").fill("15");
  await dialog.getByTestId("save-grower").click();
  await expectText(page.locator("main:visible"), /Fundy Specialty Greens\s*Not compatible/);
});

await check("Reset demo restores seed data", async () => {
  await page.getByRole("button", { name: /Reset demo/ }).first().click();
  await page.locator("[role=dialog]:visible").getByRole("button", { name: "Reset demo data" }).click();
  await expectText(page.locator("main:visible"), /Fundy Specialty Greens\s*Eligible/);
});

await check("Agreement draft shows the not-legal-advice banner and downloads", async () => {
  await page.goto(base + "/agreements", { waitUntil: "networkidle" });
  await expectText(page.getByTestId("draft-banner"), /DRAFT — FOR DISCUSSION AND PROFESSIONAL REVIEW\. NOT LEGAL ADVICE\./);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-agreement").click()]);
  const path = await download.path();
  const fs = await import("node:fs");
  const html = fs.readFileSync(path, "utf8");
  if (!html.includes("NOT LEGAL ADVICE")) throw new Error("Downloaded draft missing disclaimer");
});

await check("Agreement sections read as a document and edit in place", async () => {
  await expectText(page.getByTestId("agreement-progress"), /\d+ of 12 sections need confirmation/);
  await page.getByRole("button", { name: "Edit 5. Proposed rent" }).click();
  const editor = page.getByLabel("5. Proposed rent");
  await editor.fill("$40 per month, paid on the first of each month.");
  await page.locator("#section-rent").getByRole("button", { name: "Done" }).click();
  await expectText(page.locator("#section-rent"), /paid on the first of each month/);
});

await check("Marking a section for discussion and ready-for-review is reflected on dashboard", async () => {
  await page.getByRole("button", { name: "Mark ready for review" }).click();
  await page.goto(base + "/dashboard", { waitUntil: "networkidle" });
  await expectText(page.getByTestId("dashboard-kpis"), /Agreements awaiting review\s*1/);
  await expectText(page.getByTestId("dashboard-kpis"), /Provisional matches\s*4/);
});

await check("Landowner form validates required fields", async () => {
  await page.goto(base + "/landowner?mode=new", { waitUntil: "networkidle" });
  await page.getByTestId("save-property").click();
  await expectText(page.locator("main:visible"), /Property name is required/);
});

await check("Saving a new property makes it the active listing", async () => {
  await page.getByLabel("Property name").fill("Test Meadow (synthetic)");
  await page.getByLabel("Location or approximate address").fill("Kings County, NS");
  await page.getByTestId("form-next").click();
  await page.getByLabel("Available land area (ac)").waitFor();
  await page.getByTestId("form-next").click();
  await page.getByLabel("Water availability").waitFor();
  await page.getByTestId("save-property").click();
  await page.waitForURL(/saved=1/);
  await expectText(page.locator("h1"), /Test Meadow/);
});

await check("Explore Land lists properties including the new one", async () => {
  await page.goto(base + "/explore", { waitUntil: "networkidle" });
  await expectText(page.locator("main:visible"), /Harbour Valley Farm[\s\S]*Test Meadow/);
});

await check("Sign-in role picker links to dashboard", async () => {
  await page.goto(base + "/signin", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /I run a program/ }).click();
  await page.waitForURL(/\/dashboard/);
});

await check("Landing role card 'I want to grow' starts the grower path on the map", async () => {
  await page.getByRole("button", { name: /Reset demo/ }).first().click();
  await page.locator("[role=dialog]:visible").getByRole("button", { name: "Reset demo data" }).click();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.getByTestId("role-cards").getByRole("link", { name: /grow/i }).first().click();
  await page.waitForURL(/\/explore/);
  await expectText(page.locator("h1"), /Find a plot near you/);
  await expectText(page.getByRole("navigation", { name: "App" }), /Explore Land[\s\S]*My Requests[\s\S]*Plot Plan/);
});

await check("Explore: list and property panel work whether map tiles load or not", async () => {
  const map = page.getByTestId("land-map").first();
  await map.waitFor();
  const status = await map.getAttribute("data-status");
  if (!["loading", "ready", "error"].includes(status)) throw new Error(`Unexpected map status ${status}`);
  await expectText(page.getByTestId("listing-list"), /Harbour Valley Farm\s*Good fit[\s\S]*Margaree Riverside\s*Not a fit/);
  await page.getByTestId("listing-harbour-valley").click();
  await expectText(page.getByTestId("property-panel"), /How this fits you\s*Good fit[\s\S]*of \d+ checks pass/);
  await page.waitForURL(/property=harbour-valley/);
  const final = await map.getAttribute("data-status");
  if (final === "ready" && (await page.locator(".ac-pin").count()) !== 5) throw new Error("Map ready but pins missing");
  console.log(`      (map status: ${final})`);
});

await check("Grower sends a plot request; owner sees it in the inbox and on the listing", async () => {
  await page.getByTestId("request-plot").click();
  await page.getByTestId("request-message").fill("hi");
  await page.getByTestId("send-request").click();
  await expectText(page.locator("[role=dialog]:visible"), /Add a short note/);
  await page.getByTestId("request-message").fill("We grow cut flowers and would love a quarter acre.");
  await page.getByTestId("send-request").click();
  await expectText(page.getByTestId("toast"), /Request sent to Harbour Valley Farm/);
  await expectText(page.getByTestId("property-panel"), /Your request:\s*Sent/);
  await page.goto(base + "/requests", { waitUntil: "networkidle" });
  await expectText(page.getByTestId("request-harbour-valley"), /Sent[\s\S]*Waiting for the owner/);
  await page.getByRole("radio", { name: /Landowner/ }).click();
  await page.waitForURL(/\/landowner/);
  await expectText(page.getByTestId("requests-banner"), /1 grower request waiting/);
  await expectText(page.getByTestId("notifications"), /2/);
});

await check("Owner accepts with undo, declines with a required reason, then opens the optimizer", async () => {
  await page.goto(base + "/inbox", { waitUntil: "networkidle" });
  await page.getByTestId("inbox-list").getByRole("button", { name: /Maple Hollow Flowers/ }).click();
  await expectText(page.getByTestId("request-detail"), /Good fit[\s\S]*Fit checks against Harbour Valley Farm/);
  await page.getByTestId("accept-request").click();
  await page.getByTestId("toast").getByRole("button", { name: "Undo" }).click();
  await page.getByRole("tab", { name: /Needs a reply/ }).click();
  await expectText(page.getByTestId("inbox-list"), /Maple Hollow Flowers/);
  await page.getByTestId("inbox-list").getByRole("button", { name: /Maple Hollow Flowers/ }).click();
  await page.getByTestId("accept-request").click();
  await page.getByRole("tab", { name: /Needs a reply/ }).click();
  await page.getByTestId("inbox-list").getByRole("button", { name: /Salt & Thyme Herbs/ }).click();
  await page.getByTestId("decline-request").click();
  await page.getByTestId("confirm-decline").click();
  await expectText(page.getByTestId("request-detail"), /Give the grower a short reason/);
  await page.getByTestId("decline-reason").fill("Season already committed");
  await page.getByTestId("confirm-decline").click();
  await expectText(page.getByRole("tab", { name: /Declined/ }), /1/);
  await page.getByRole("tab", { name: /Accepted/ }).click();
  await page.getByTestId("open-in-optimizer").click();
  await page.waitForURL(/\/optimizer/);
  await recalc();
  await expectText(stats(), /5 \/ 6/);
  await expectText(page.locator("main:visible"), /Maple Hollow Flowers/);
});

await check("Grower is notified and sees Accepted; dashboard pipeline counts update", async () => {
  await page.getByRole("radio", { name: /Grower/ }).click();
  await page.waitForURL(/\/explore/);
  await page.getByTestId("notifications").click();
  await expectText(page.locator("[role=dialog][aria-label=Notifications]"), /Harbour Valley Farm accepted your request/);
  await page.keyboard.press("Escape");
  await page.goto(base + "/requests", { waitUntil: "networkidle" });
  await expectText(page.getByTestId("request-harbour-valley"), /Accepted[\s\S]*See the shared plot plan/);
  await page.goto(base + "/dashboard", { waitUntil: "networkidle" });
  await expectText(page.getByTestId("request-pipeline"), /Sent\s*0[\s\S]*Viewed by owner\s*0[\s\S]*Accepted\s*1[\s\S]*Declined\s*1/);
});

await check("Cmd/Ctrl+K palette finds a listing and navigates to it", async () => {
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByTestId("command-palette").waitFor();
  await page.keyboard.type("lahave");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/explore\?property=lahave-river/);
  await expectText(page.getByTestId("property-panel"), /LaHave River Plot/);
});

await check("No browser console errors during the journey", async () => {
  const relevant = consoleErrors.filter((e) => !/favicon/.test(e));
  if (relevant.length) throw new Error(relevant.join(" | ").slice(0, 400));
});

await page.evaluate(() => localStorage.clear());

await check("Reduced motion: key pages and the optimizer run without console errors", async () => {
  const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const p = await reduced.newPage();
  const errors = [];
  trackErrors(p, errors);
  for (const route of ["/", "/explore", "/inbox", "/requests", "/dashboard"]) await p.goto(base + route, { waitUntil: "networkidle" });
  await p.goto(base + "/optimizer", { waitUntil: "networkidle" });
  await p.getByTestId("run-optimizer").click();
  // With reduced motion, numbers render final values immediately.
  const text = await p.getByTestId("result-stats").innerText();
  if (!/4 \/ 5[\s\S]*1\.50/.test(text)) throw new Error(`Stats not final under reduced motion: ${text.slice(0, 120)}`);
  await reduced.close();
  if (errors.length) throw new Error(errors.join(" | ").slice(0, 400));
});

await check("Offline tiles: map shows its fallback and listings still work", async () => {
  const offline = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await offline.route(/openfreemap\.org/, (r) => r.abort());
  const p = await offline.newPage();
  const errors = [];
  trackErrors(p, errors);
  await p.goto(base + "/explore", { waitUntil: "domcontentloaded" });
  await p.getByTestId("map-fallback").waitFor({ timeout: 20000 });
  await p.getByTestId("listing-cobequid-bay").click();
  await expectText(p.getByTestId("property-panel"), /Cobequid Bay Acres/);
  await offline.close();
  const relevant = errors.filter((e) => !/Failed to load resource/.test(e));
  if (relevant.length) throw new Error(relevant.join(" | ").slice(0, 400));
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
