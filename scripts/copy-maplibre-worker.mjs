// Copies MapLibre's self-contained module worker into public/ so the map can
// load it from a stable URL (bundlers rename the main chunk, which breaks the
// library's default relative worker lookup). Runs before dev and build.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = join(dirname(require.resolve("maplibre-gl/package.json")), "dist");
mkdirSync("public/vendor", { recursive: true });
copyFileSync(join(dist, "maplibre-gl-worker.mjs"), "public/vendor/maplibre-gl-worker.mjs");
console.log("maplibre worker copied to public/vendor/");
