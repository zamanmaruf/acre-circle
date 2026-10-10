import { describe, expect, it } from "vitest";
import { candidatesFor, runAllocation } from "./engine/allocate";
import { formatGrowerList, groupOpenIssues, sharedConcerns } from "./issues";
import { SEED_GROWERS, SEED_PROPERTIES } from "./seed";

const property = structuredClone(SEED_PROPERTIES[0]);
const growers = structuredClone(SEED_GROWERS);
const result = runAllocation(property, candidatesFor(property, growers));

describe("groupOpenIssues", () => {
  it("covers every engine open issue exactly once", () => {
    const groups = groupOpenIssues(result, growers, property.soilTested);
    const covered = groups.reduce((n, g) => n + Math.max(1, g.growers.length), 0);
    expect(covered).toBe(result.openIssues.length);
  });

  it("merges the owner-reported water warning across the placed growers who need water (D is self-supplied)", () => {
    const water = groupOpenIssues(result, growers, property.soilTested).find((g) => /water access/.test(g.text) && g.kind === "verify");
    expect(water?.growers).toEqual(["Grower A", "Grower B", "Grower C"]);
  });

  it("keeps deferred growers and the missing soil test as their own rows", () => {
    const groups = groupOpenIssues(result, growers, false);
    expect(groups.filter((g) => g.kind === "deferred").map((g) => g.growers)).toEqual([["Grower E"]]);
    expect(groups.some((g) => g.kind === "property")).toBe(true);
    expect(groupOpenIssues(result, growers, true).some((g) => g.kind === "property")).toBe(false);
  });
});

describe("sharedConcerns", () => {
  it("returns non-passing checks that repeat across applicants", () => {
    const shared = sharedConcerns(result.evaluations);
    expect(shared.find((c) => c.label === "Water")?.count).toBe(3);
    expect(shared.every((c) => c.count >= 2)).toBe(true);
  });
});

describe("formatGrowerList", () => {
  it("formats one, two and many labels", () => {
    expect(formatGrowerList(["Grower A"])).toBe("Grower A");
    expect(formatGrowerList(["Grower A", "Grower B"])).toBe("Growers A and B");
    expect(formatGrowerList(["Grower A", "Grower B", "Grower C"])).toBe("Growers A, B and C");
  });
});
