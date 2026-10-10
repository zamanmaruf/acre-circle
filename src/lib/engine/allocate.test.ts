import { describe, expect, it } from "vitest";
import { SEED_GROWERS, SEED_PROPERTIES } from "../seed";
import type { Grower, Property } from "../types";
import { candidatesFor, runAllocation } from "./allocate";
import { buildExplanationFacts, templateExplanation } from "./explain";

const baseProperty = (): Property => structuredClone(SEED_PROPERTIES[0]);
const baseGrowers = (): Grower[] => structuredClone(SEED_GROWERS);
const run = (p: Property, g: Grower[]) => runAllocation(p, candidatesFor(p, g));
const byLabel = (r: ReturnType<typeof run>, growers: Grower[], label: string) => {
  const g = growers.find((x) => x.label === label)!;
  return r.evaluations.find((e) => e.growerId === g.id)!;
};

describe("allocation engine — demo scenario", () => {
  it("places growers A–D on 0.50/0.50/0.25/0.25 ac and defers E for unverified irrigation", () => {
    const growers = baseGrowers();
    const r = run(baseProperty(), growers);
    expect(r.valid).toBe(true);
    expect(r.plots.map((p) => [p.plotId, p.growerId, p.acres])).toEqual([
      ["A", "grower-a", 0.5],
      ["B", "grower-b", 0.5],
      ["C", "grower-c", 0.25],
      ["D", "grower-d", 0.25],
    ]);
    expect(r.totals.allocatedAcres).toBe(1.5);
    expect(r.totals.reservedAcres).toBe(0.5);
    const e = byLabel(r, growers, "Grower E");
    expect(e.status).toBe("deferred");
    expect(e.summary).toMatch(/irrigation/i);
  });

  it("is deterministic: identical inputs give identical output and fingerprint", () => {
    const a = run(baseProperty(), baseGrowers());
    const b = run(baseProperty(), baseGrowers().reverse());
    expect(a).toEqual(b);
  });

  it("changes the fingerprint when an input changes", () => {
    const p = baseProperty();
    const a = run(p, baseGrowers());
    p.cultivableAcres = 1;
    expect(run(p, baseGrowers()).inputFingerprint).not.toBe(a.inputFingerprint);
  });

  it("flags owner-reported water as an open issue rather than treating it as verified", () => {
    const r = run(baseProperty(), baseGrowers());
    expect(r.openIssues.some((i) => /not been independently verified/.test(i))).toBe(true);
  });
});

describe("allocation engine — hard constraints", () => {
  it("never allocates more than the cultivable area", () => {
    for (const acres of [0, 0.2, 0.25, 0.5, 0.8, 1, 1.25, 1.5]) {
      const p = baseProperty();
      p.cultivableAcres = acres;
      const r = run(p, baseGrowers());
      const sum = r.plots.reduce((s, x) => s + x.acres, 0);
      expect(sum).toBeLessThanOrEqual(acres + 1e-9);
      for (const plot of r.plots) {
        expect(plot.acres).toBeGreaterThanOrEqual(p.minPlotAcres - 1e-9);
        expect(plot.acres).toBeLessThanOrEqual(p.maxPlotAcres + 1e-9);
      }
    }
  });

  it("reducing cultivable land to 1 acre drops to three placements and explains the omission", () => {
    const p = baseProperty();
    p.cultivableAcres = 1;
    const growers = baseGrowers();
    const r = run(p, growers);
    expect(r.plots.length).toBe(3);
    expect(r.totals.allocatedAcres).toBeLessThanOrEqual(1);
    const notPlaced = r.evaluations.filter((e) => e.status === "not-placed");
    expect(notPlaced.length).toBe(1);
    expect(notPlaced[0].summary.length).toBeGreaterThan(20);
  });

  it("returns no matches when no grower fits", () => {
    const p = baseProperty();
    p.cultivableAcres = 0.2;
    const r = run(p, baseGrowers());
    expect(r.plots).toEqual([]);
    expect(r.evaluations.every((e) => e.status === "rejected" || e.status === "deferred")).toBe(true);
    expect(templateExplanation(buildExplanationFacts(p, baseGrowers(), r)).headline).toMatch(/No growers/);
  });

  it("defers water-dependent growers when water is unknown, and rejects them when unavailable", () => {
    const growers = baseGrowers();
    const p = baseProperty();
    p.water = "unknown";
    let r = run(p, growers);
    expect(byLabel(r, growers, "Grower A").status).toBe("deferred");
    expect(byLabel(r, growers, "Grower D").status).toBe("placed");

    p.water = "none";
    r = run(p, growers);
    expect(byLabel(r, growers, "Grower A").status).toBe("rejected");
    expect(byLabel(r, growers, "Grower E").status).toBe("rejected");
    expect(r.plots.map((x) => x.growerId)).toEqual(["grower-d"]);
  });

  it("rejects a grower whose budget cannot cover the minimum plot", () => {
    const growers = baseGrowers();
    growers.find((g) => g.label === "Grower B")!.budgetMonthly = 15;
    const r = run(baseProperty(), growers);
    const b = byLabel(r, growers, "Grower B");
    expect(b.status).toBe("rejected");
    expect(b.summary).toMatch(/covers about/);
  });

  it("shrinks a plot to fit a reduced budget instead of exceeding it", () => {
    const growers = baseGrowers();
    const p = baseProperty();
    growers.find((g) => g.label === "Grower B")!.budgetMonthly = 30;
    const r = run(p, growers);
    const b = byLabel(r, growers, "Grower B");
    expect(b.status).toBe("placed");
    expect(b.monthlyRent!).toBeLessThanOrEqual(30);
    expect(b.allocatedAcres).toBe(0.35);
  });

  it("rejects prohibited activities", () => {
    const growers = baseGrowers();
    const p = baseProperty();
    p.allowedActivities = p.allowedActivities.filter((a) => a !== "culinary-herbs");
    const r = run(p, growers);
    expect(byLabel(r, growers, "Grower C").status).toBe("rejected");
  });

  it("places the irrigation grower once irrigation is verified, within capacity", () => {
    const growers = baseGrowers();
    const p = baseProperty();
    p.irrigation = "verified";
    const r = run(p, growers);
    expect(byLabel(r, growers, "Grower E").status).not.toBe("deferred");
    expect(r.totals.allocatedAcres).toBeLessThanOrEqual(1.5);
    expect(r.plots.length).toBe(4);
  });

  it("does not seat certified-organic and conventional growers together", () => {
    const growers = baseGrowers();
    growers.find((g) => g.label === "Grower C")!.practice = "conventional";
    const r = run(baseProperty(), growers);
    const placed = r.plots.map((x) => x.growerId);
    expect(placed.includes("grower-b") && placed.includes("grower-c")).toBe(false);
  });

  it("respects the owner's maximum number of growers", () => {
    const p = baseProperty();
    p.maxGrowers = 2;
    const r = run(p, baseGrowers());
    expect(r.plots.length).toBeLessThanOrEqual(2);
  });

  it("rejects invalid property input instead of producing an allocation", () => {
    const p = baseProperty();
    p.cultivableAcres = 1.8;
    const r = run(p, baseGrowers());
    expect(r.valid).toBe(false);
    expect(r.plots).toEqual([]);
  });

  it("rejects a grower who needs year-round access on seasonal land", () => {
    const growers = baseGrowers();
    const p = baseProperty();
    p.seasonalAvailability = "growing-season";
    const r = run(p, growers);
    expect(byLabel(r, growers, "Grower A").status).toBe("rejected");
  });
});
