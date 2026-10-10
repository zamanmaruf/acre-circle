// End-to-end demo journey test. Requires the app running (npm run dev or npm start).
// Usage: node scripts/e2e.mjs   (BASE_URL defaults to http://localhost:3000; CHROME_PATH optional)
import { chromium } from "playwright-core";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(e.message));

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
const expectText = async (locator, re) => {
  await locator.first().waitFor({ timeout: 8000 });
  const text = await locator.first().innerText();
  if (!re.test(text)) throw new Error(`Expected ${re} in: ${text.slice(0, 200)}`);
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
  const svgText = await page.locator("svg[role=img]").first().innerText().catch(() => "");
  void svgText;
});

await check("Plot sizes are 0.50 / 0.50 / 0.25 / 0.25 ac", async () => {
  const legend = await page.locator("main:visible").innerText();
  for (const re of [/Plot A · Grower A · 0\.50 ac/, /Plot B · Grower B · 0\.50 ac/, /Plot C · Grower C · 0\.25 ac/, /Plot D · Grower D · 0\.25 ac/]) {
    if (!re.test(legend)) throw new Error(`Missing ${re}`);
  }
});

await check("Explanation is labelled rule-based when no LLM key is set", async () => {
  await expectText(page.locator("main:visible"), /Rule-based · generated from engine output/);
  await expectText(page.locator("main:visible"), /LLM not configured|LLM connected/);
});

await check("Reduce land to 1.0 ac → stale warning → recalculation drops to 3 placements within 1.00 ac", async () => {
  await scenario("Reduce cultivable land to 1.0 ac");
  await expectText(page.locator("main:visible"), /Inputs changed/);
  await recalc();
  await expectText(stats(), /3 \/ 5/);
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
  await page.getByRole("link", { name: /Agricultural organization/ }).click();
  await page.waitForURL(/\/dashboard/);
});

await check("No browser console errors during the journey", async () => {
  const relevant = consoleErrors.filter((e) => !/favicon/.test(e));
  if (relevant.length) throw new Error(relevant.join(" | ").slice(0, 400));
});

await page.evaluate(() => localStorage.clear());
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
