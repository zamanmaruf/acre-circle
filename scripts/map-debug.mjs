// Prints map status, canvas size and any console output for a page, then saves a screenshot.
// Usage: node scripts/map-debug.mjs /explore [out-name]
// Env: BASE_URL, WIDTH (default 1440), HEIGHT (default 900), WAIT ms, ROLE (grower|landowner|coordinator),
//      CLICK (CSS selector clicked after load), FULL=1 for a full-page screenshot.
import { chromium } from "playwright-core";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({
  viewport: { width: Number(process.env.WIDTH ?? 1440), height: Number(process.env.HEIGHT ?? 900) },
});
page.on("console", (m) => console.log(`[${m.type()}] ${m.text().slice(0, 300)}`));
page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => console.log(`[requestfailed] ${r.url().slice(0, 120)} ${r.failure()?.errorText}`));
if (process.env.ROLE) {
  await page.goto(base + "/signin", { waitUntil: "networkidle" });
  await page.evaluate((role) => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("acre-circle"));
    if (!key) return;
    const s = JSON.parse(localStorage.getItem(key) ?? "{}");
    localStorage.setItem(key, JSON.stringify({ ...s, role }));
  }, process.env.ROLE);
}
await page.goto(base + (process.argv[2] ?? "/explore"), { waitUntil: "networkidle" });
await page.waitForTimeout(Number(process.env.WAIT ?? 12000));
if (process.env.CLICK) {
  await page.locator(process.env.CLICK).first().click();
  await page.waitForTimeout(2500);
}
const info = await page.evaluate(() =>
  [...document.querySelectorAll("[data-testid=land-map],[data-testid=pin-picker]")].map((el) => {
    const c = el.querySelector("canvas");
    return { status: el.getAttribute("data-status"), box: el.getBoundingClientRect().height, canvas: c ? [c.width, c.height] : null, pins: el.querySelectorAll(".ac-pin").length };
  }),
);
console.log(JSON.stringify(info));
await page.screenshot({ path: `.screenshots/${process.argv[3] ?? "map-debug"}.png`, fullPage: process.env.FULL === "1" });
await browser.close();
