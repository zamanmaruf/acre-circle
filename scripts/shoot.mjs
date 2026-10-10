// Usage: node scripts/shoot.mjs <path> [<path> ...]   (BASE_URL defaults to http://localhost:3000)
// Saves full-page screenshots to .screenshots/ and prints console errors.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const width = Number(process.env.WIDTH ?? 1440);
const paths = process.argv.slice(2);
mkdirSync(".screenshots", { recursive: true });

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
const page = await browser.newPage({ viewport: { width, height: 900 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(`[console] ${m.text()}`));
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));

for (const p of paths) {
  const [path, action] = p.split("#!");
  await page.goto(base + path, { waitUntil: "networkidle" });
  if (action) {
    for (const step of action.split(";")) {
      const [kind, arg] = step.split("=");
      if (kind === "click") await page.getByText(arg, { exact: false }).first().click();
      if (kind === "testid") await page.getByTestId(arg).first().click();
      if (kind === "wait") await page.waitForTimeout(Number(arg));
    }
  }
  await page.waitForTimeout(1200);
  const name = `${path.replace(/[^a-z0-9]+/gi, "_") || "home"}${action ? "_" + action.replace(/[^a-z0-9]+/gi, "_").slice(0, 40) : ""}-${width}.png`;
  await page.screenshot({ path: `.screenshots/${name}`, fullPage: process.env.FULL !== "0" });
  console.log("shot", name);
}
console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
