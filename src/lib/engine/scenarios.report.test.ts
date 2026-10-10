import { it } from "vitest";
import { SEED_GROWERS, SEED_PROPERTIES } from "../seed";
import type { Grower, Property } from "../types";
import { candidatesFor, runAllocation } from "./allocate";

const scenarios: { name: string; mutate: (p: Property, g: Grower[]) => void }[] = [
  { name: "Seed", mutate: () => {} },
  { name: "Cultivable 1.0 ac", mutate: (p) => (p.cultivableAcres = 1) },
  { name: "Water none", mutate: (p) => (p.water = "none") },
  { name: "Water unknown", mutate: (p) => (p.water = "unknown") },
  { name: "Irrigation verified", mutate: (p) => (p.irrigation = "verified") },
  { name: "B budget $15", mutate: (_p, g) => (g.find((x) => x.id === "grower-b")!.budgetMonthly = 15) },
  { name: "A wants 0.75 ($60)", mutate: (_p, g) => Object.assign(g.find((x) => x.id === "grower-a")!, { minAcres: 0.5, desiredAcres: 0.75, budgetMonthly: 60 }) },
  { name: "No herbs", mutate: (p) => (p.allowedActivities = p.allowedActivities.filter((a) => a !== "culinary-herbs")) },
];

it("prints scenario report", () => {
  for (const s of scenarios) {
    const p = structuredClone(SEED_PROPERTIES[0]);
    const g = structuredClone(SEED_GROWERS);
    s.mutate(p, g);
    const r = runAllocation(p, candidatesFor(p, g));
    const plots = r.plots.map((x) => `${x.plotId}:${x.growerId.slice(-1).toUpperCase()}=${x.acres}`).join(" ");
    const others = r.evaluations
      .filter((e) => e.status !== "placed")
      .map((e) => `${e.growerId.slice(-1).toUpperCase()}[${e.status}] ${e.summary}`)
      .join("\n      ");
    console.log(`${s.name}: ${plots} | total ${r.totals.allocatedAcres}\n      ${others}`);
  }
});
