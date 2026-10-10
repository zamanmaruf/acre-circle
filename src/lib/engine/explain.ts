import { formatCurrency, WATER_LABELS, IRRIGATION_LABELS } from "../labels";
import type { AllocationResult, Grower, Property } from "../types";

export interface ExplanationFacts {
  property: {
    name: string;
    location: string;
    totalAcres: number;
    cultivableAcres: number;
    reservedAcres: number;
    water: string;
    irrigation: string;
    soilTested: boolean;
    rentPerAcreMonthly: number;
  };
  objective: string;
  placements: { plot: string; grower: string; crop: string; acres: number; requestedAcres: number; monthlyRent: number; budgetMonthly: number; caveats: string[] }[];
  notPlaced: { grower: string; crop: string; status: string; reason: string }[];
  totals: AllocationResult["totals"];
  openIssues: string[];
  assumptions: string[];
}

export const OBJECTIVE_DESCRIPTION =
  "Maximise the number of growers placed, then total acres allocated, then minimise unresolved issues, then make the split as even as possible (relative to each grower's request). All hard constraints must hold.";

export function buildExplanationFacts(property: Property, growers: Grower[], result: AllocationResult): ExplanationFacts {
  const byId = new Map(growers.map((g) => [g.id, g]));
  return {
    property: {
      name: property.name,
      location: property.location,
      totalAcres: result.totals.totalAcres,
      cultivableAcres: result.totals.cultivableAcres,
      reservedAcres: result.totals.reservedAcres,
      water: WATER_LABELS[property.water],
      irrigation: IRRIGATION_LABELS[property.irrigation],
      soilTested: property.soilTested,
      rentPerAcreMonthly: property.rentPerAcreMonthly,
    },
    objective: OBJECTIVE_DESCRIPTION,
    placements: result.plots.map((p) => {
      const g = byId.get(p.growerId)!;
      const ev = result.evaluations.find((e) => e.growerId === p.growerId)!;
      return {
        plot: p.plotId,
        grower: `${g.label} (${g.name})`,
        crop: g.cropType,
        acres: p.acres,
        requestedAcres: g.desiredAcres,
        monthlyRent: p.monthlyRent,
        budgetMonthly: g.budgetMonthly,
        caveats: ev.checks.filter((c) => c.status === "warn").map((c) => c.detail),
      };
    }),
    notPlaced: result.evaluations
      .filter((e) => e.status !== "placed")
      .map((e) => {
        const g = byId.get(e.growerId)!;
        return { grower: `${g.label} (${g.name})`, crop: g.cropType, status: e.status, reason: e.summary };
      }),
    totals: result.totals,
    openIssues: result.openIssues,
    assumptions: result.assumptions,
  };
}

const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const countWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

export interface TemplateExplanation {
  headline: string;
  paragraphs: string[];
}

/** Rule-based explanation built only from the engine's structured output. */
export function templateExplanation(facts: ExplanationFacts): TemplateExplanation {
  const p = facts.property;
  const t = facts.totals;
  const paragraphs: string[] = [];

  const placed = facts.placements.length;
  const headline =
    placed === 0
      ? `No growers can currently be placed on ${p.name}.`
      : `${countWord(placed)} grower${placed === 1 ? "" : "s"} provisionally placed on ${t.allocatedAcres.toFixed(2)} of ${t.cultivableAcres.toFixed(2)} cultivable acres.`;

  paragraphs.push(
    `${p.name} has ${t.cultivableAcres.toFixed(2)} acres provisionally available for cultivation after setting aside ${t.reservedAcres.toFixed(2)} acres for shared infrastructure and access${t.otherAcres > 0 ? `, with a further ${t.otherAcres.toFixed(2)} acres not offered for cultivation` : ""}.`,
  );

  if (placed > 0) {
    const list = facts.placements
      .map((x) => `Plot ${x.plot} (${x.acres.toFixed(2)} ac) for ${x.grower.split(" (")[0]}, ${x.crop.toLowerCase()}`)
      .join("; ");
    paragraphs.push(
      `${countWord(placed)} applicant${placed === 1 ? " meets" : "s meet"} the stated activity, access, season, plot-size and budget constraints together: ${list}. Combined rent at the owner's stated rate would be about ${formatCurrency(facts.placements.reduce((s, x) => s + x.monthlyRent, 0))} per month.`,
    );
    const reduced = facts.placements.filter((x) => x.acres < x.requestedAcres);
    if (reduced.length) {
      paragraphs.push(
        `To fit the available area or budgets, ${reduced.map((x) => `${x.grower.split(" (")[0]} receives ${x.acres.toFixed(2)} of ${x.requestedAcres.toFixed(2)} ac requested`).join("; ")}.`,
      );
    }
    if (t.unallocatedAcres > 0) {
      paragraphs.push(`${t.unallocatedAcres.toFixed(2)} cultivable acres remain unallocated under the current constraints.`);
    }
  } else {
    paragraphs.push(
      "No combination of applicants satisfies every hard constraint. Review the deferred and rejected reasons below; adjusting land, budgets or verifying infrastructure may open options.",
    );
  }

  for (const np of facts.notPlaced) {
    const verb = np.status === "deferred" ? "is deferred" : np.status === "rejected" ? "is not compatible" : "is not included";
    paragraphs.push(`${np.grower.split(" (")[0]} (${np.crop.toLowerCase()}) ${verb}: ${np.reason}`);
  }

  if (facts.openIssues.length) {
    paragraphs.push(
      `Before any agreement, ${facts.openIssues.length} item${facts.openIssues.length === 1 ? "" : "s"} need${facts.openIssues.length === 1 ? "s" : ""} real-world confirmation, including water status (${p.water.toLowerCase()})${p.soilTested ? "" : " and the absence of a soil test"}.`,
    );
  }

  return { headline, paragraphs };
}
