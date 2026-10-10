import { ACTIVITY_LABELS, FACILITY_LABELS, formatCurrency } from "../labels";
import type {
  AllocationResult,
  CandidateEvaluation,
  CandidatePlan,
  ConstraintCheck,
  Grower,
  PlanScore,
  PlotAllocation,
  Property,
} from "../types";
import { fnv1a, stableStringify } from "./fingerprint";
import { approxDistanceKm } from "./regions";

export const ENGINE_VERSION = "1.0.0";

/** All area math runs in integer hundredths of an acre to avoid floating-point drift. */
const UNITS_PER_ACRE = 100;
/** Plots are sized in 0.05-acre increments. */
export const STEP_UNITS = 5;
/** Exhaustive search is exact but exponential; beyond this many eligible candidates we stop. */
export const MAX_SEARCH_CANDIDATES = 16;

const toUnits = (acres: number) => Math.round(acres * UNITS_PER_ACRE);
const toAcres = (units: number) => units / UNITS_PER_ACRE;
const ceilStep = (units: number) => Math.ceil(units / STEP_UNITS) * STEP_UNITS;
const floorStep = (units: number) => Math.floor(units / STEP_UNITS) * STEP_UNITS;
const ac = (units: number) => `${toAcres(units).toFixed(2)} ac`;

export function candidatesFor(property: Property, growers: Grower[]): Grower[] {
  return growers
    .filter((g) => g.interestedPropertyIds.includes(property.id))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function validateProperty(p: Property): string[] {
  const errors: string[] = [];
  if (!(p.totalAcres > 0)) errors.push("Total area must be greater than 0 acres.");
  if (p.cultivableAcres < 0) errors.push("Cultivable area cannot be negative.");
  if (p.reservedAcres < 0) errors.push("Reserved area cannot be negative.");
  if (toUnits(p.cultivableAcres) + toUnits(p.reservedAcres) > toUnits(p.totalAcres)) {
    errors.push("Cultivable area plus reserved/shared area cannot exceed total area.");
  }
  if (!(p.minPlotAcres > 0)) errors.push("Minimum plot size must be greater than 0.");
  if (p.minPlotAcres > p.maxPlotAcres) errors.push("Minimum plot size cannot exceed maximum plot size.");
  if (!Number.isInteger(p.maxGrowers) || p.maxGrowers < 1) errors.push("Maximum growers must be a whole number of at least 1.");
  if (p.rentPerAcreMonthly < 0) errors.push("Rent cannot be negative.");
  return errors;
}

export function validateGrower(g: Grower): string[] {
  const errors: string[] = [];
  if (!(g.minAcres > 0)) errors.push("Minimum workable area must be greater than 0.");
  if (g.minAcres > g.desiredAcres) errors.push("Minimum workable area cannot exceed desired area.");
  if (g.budgetMonthly < 0) errors.push("Budget cannot be negative.");
  if (g.maxTravelKm < 0) errors.push("Travel distance cannot be negative.");
  if (g.activities.length === 0) errors.push("At least one intended activity is required.");
  return errors;
}

interface Screened {
  grower: Grower;
  checks: ConstraintCheck[];
  lowerU: number;
  upperU: number;
  desiredU: number;
  warnCount: number;
  status: "eligible" | "deferred" | "rejected";
}

function listOf(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function screenCandidate(property: Property, grower: Grower): Screened {
  const checks: ConstraintCheck[] = [];
  const profileErrors = validateGrower(grower);
  if (profileErrors.length) {
    checks.push({ id: "profile", label: "Profile completeness", status: "fail", detail: profileErrors.join(" ") });
  }

  const disallowed = grower.activities.filter((a) => !property.allowedActivities.includes(a));
  const activityNames = grower.activities.map((a) => ACTIVITY_LABELS[a].toLowerCase());
  checks.push(
    disallowed.length
      ? {
          id: "activity",
          label: "Permitted activity",
          status: "fail",
          detail: `The owner does not permit ${listOf(disallowed.map((a) => ACTIVITY_LABELS[a].toLowerCase()))}.`,
        }
      : {
          id: "activity",
          label: "Permitted activity",
          status: "pass",
          detail: `Intended use (${listOf(activityNames)}) is permitted by the owner.`,
        },
  );

  if (grower.season === "year-round" && property.seasonalAvailability === "growing-season") {
    checks.push({
      id: "season",
      label: "Seasonal access",
      status: "fail",
      detail: "Needs year-round access (e.g. overwintering crops), but land is only available April to November.",
    });
  } else {
    checks.push({
      id: "season",
      label: "Seasonal access",
      status: "pass",
      detail: grower.season === "year-round" ? "Year-round access is available." : "Growing-season access is available.",
    });
  }

  if (grower.needsVehicleAccess && !property.vehicleAccess) {
    checks.push({ id: "vehicle", label: "Vehicle access", status: "fail", detail: "Requires vehicle access; property is walk-in only." });
  } else {
    checks.push({
      id: "vehicle",
      label: "Vehicle access",
      status: "pass",
      detail: grower.needsVehicleAccess ? "Vehicle access reported by owner." : "No vehicle access required.",
    });
  }

  const km = approxDistanceKm(grower.region, property.region);
  checks.push(
    km > grower.maxTravelKm
      ? {
          id: "travel",
          label: "Travel distance",
          status: "fail",
          detail: `Approx. ${km} km from ${grower.region}; exceeds the grower's ${grower.maxTravelKm} km limit.`,
        }
      : {
          id: "travel",
          label: "Travel distance",
          status: "pass",
          detail: `Approx. ${km} km from ${grower.region} (limit ${grower.maxTravelKm} km).`,
        },
  );

  checks.push(waterCheck(property, grower));

  const desiredU = toUnits(grower.desiredAcres);
  const lowerU = ceilStep(Math.max(toUnits(grower.minAcres), toUnits(property.minPlotAcres)));
  const sizeUpperU = floorStep(Math.min(desiredU, toUnits(property.maxPlotAcres)));
  if (lowerU > sizeUpperU) {
    let detail = `No plot size satisfies both the grower (${grower.minAcres.toFixed(2)}–${grower.desiredAcres.toFixed(2)} ac) and the owner's plot limits (${property.minPlotAcres.toFixed(2)}–${property.maxPlotAcres.toFixed(2)} ac).`;
    if (desiredU < toUnits(property.minPlotAcres)) {
      detail = `Desired ${ac(desiredU)} is below the owner's minimum plot of ${ac(toUnits(property.minPlotAcres))}.`;
    } else if (toUnits(grower.minAcres) > toUnits(property.maxPlotAcres)) {
      detail = `Minimum workable ${ac(toUnits(grower.minAcres))} exceeds the owner's maximum plot of ${ac(toUnits(property.maxPlotAcres))}.`;
    }
    checks.push({ id: "plot-size", label: "Plot size limits", status: "fail", detail });
  } else {
    checks.push({
      id: "plot-size",
      label: "Plot size limits",
      status: "pass",
      detail: `Workable range ${ac(lowerU)}–${ac(sizeUpperU)} fits the owner's ${property.minPlotAcres.toFixed(2)}–${property.maxPlotAcres.toFixed(2)} ac plot limits.`,
    });
  }

  const rent = property.rentPerAcreMonthly;
  const affordableU =
    rent > 0 ? floorStep(Math.floor((grower.budgetMonthly * UNITS_PER_ACRE) / rent + 1e-9)) : Number.POSITIVE_INFINITY;
  let upperU = Math.min(sizeUpperU, affordableU);
  if (lowerU <= sizeUpperU) {
    if (upperU < lowerU) {
      checks.push({
        id: "budget",
        label: "Budget",
        status: "fail",
        detail: `${formatCurrency(grower.budgetMonthly)}/mo covers about ${ac(Math.max(0, affordableU))} at ${formatCurrency(rent)}/ac/mo; the smallest workable plot (${ac(lowerU)}) costs ${formatCurrency((toAcres(lowerU) * rent))}/mo.`,
      });
    } else if (upperU < sizeUpperU) {
      checks.push({
        id: "budget",
        label: "Budget",
        status: "warn",
        detail: `Budget of ${formatCurrency(grower.budgetMonthly)}/mo limits the plot to ${ac(upperU)} (desired ${ac(desiredU)}).`,
      });
    } else {
      checks.push({
        id: "budget",
        label: "Budget",
        status: "pass",
        detail: `${ac(sizeUpperU)} costs ${formatCurrency(toAcres(sizeUpperU) * rent)}/mo, within the ${formatCurrency(grower.budgetMonthly)}/mo budget.`,
      });
    }
  }

  const capU = floorStep(toUnits(property.cultivableAcres));
  if (lowerU > capU) {
    checks.push({
      id: "capacity",
      label: "Cultivable area",
      status: "fail",
      detail: `Smallest workable plot (${ac(lowerU)}) exceeds the ${ac(capU)} cultivable area.`,
    });
  } else {
    checks.push({ id: "capacity", label: "Cultivable area", status: "pass", detail: `Fits within ${ac(capU)} cultivable area.` });
  }
  upperU = Math.min(upperU, capU);

  const missing = grower.equipmentNeeds.filter((f) => !property.sharedFacilities.includes(f));
  checks.push(
    missing.length
      ? {
          id: "equipment",
          label: "Shared facilities",
          status: "warn",
          detail: `Requested ${listOf(missing.map((f) => FACILITY_LABELS[f].toLowerCase()))} not listed by the owner; needs discussion.`,
        }
      : {
          id: "equipment",
          label: "Shared facilities",
          status: "pass",
          detail: grower.equipmentNeeds.length
            ? `Requested ${listOf(grower.equipmentNeeds.map((f) => FACILITY_LABELS[f].toLowerCase()))} listed by owner.`
            : "No shared facilities required.",
        },
  );

  const status = checks.some((c) => c.status === "fail")
    ? "rejected"
    : checks.some((c) => c.status === "pending")
      ? "deferred"
      : "eligible";

  return {
    grower,
    checks,
    lowerU,
    upperU,
    desiredU,
    warnCount: checks.filter((c) => c.status === "warn").length,
    status,
  };
}

function waterCheck(property: Property, grower: Grower): ConstraintCheck {
  const base = { id: "water", label: "Water" };
  if (grower.waterNeed === "none") {
    return { ...base, status: "pass", detail: "Grower supplies its own water (rain-fed or brought on site)." };
  }
  if (grower.waterNeed === "basic") {
    switch (property.water) {
      case "verified":
        return { ...base, status: "pass", detail: "Water access verified on site." };
      case "owner-reported":
        return {
          ...base,
          status: "warn",
          detail: "Owner reports water access, but it has not been independently verified. Confirm before any agreement.",
        };
      case "unknown":
        return {
          ...base,
          status: "pending",
          detail: "Needs basic water access, and water availability is unknown. Deferred until confirmed.",
        };
      case "none":
        return { ...base, status: "fail", detail: "Needs water access; owner reports none available." };
    }
  }
  if (property.water === "none") {
    return { ...base, status: "fail", detail: "Needs irrigation; owner reports no water source." };
  }
  switch (property.irrigation) {
    case "verified":
      return { ...base, status: "pass", detail: "Irrigation capacity verified." };
    case "unverified":
      return {
        ...base,
        status: "pending",
        detail: "Requires verified irrigation capacity, which has not been confirmed. Not promised; deferred until verified.",
      };
    case "none":
      return { ...base, status: "fail", detail: "Requires irrigation; property has no irrigation." };
  }
}

function practicesConflict(a: Grower, b: Grower): boolean {
  return (
    (a.practice === "certified-organic" && b.practice === "conventional") ||
    (a.practice === "conventional" && b.practice === "certified-organic")
  );
}

/**
 * Distributes capacity above each grower's lower bound one step at a time to the
 * grower with the lowest share of their desired area (ties by input order).
 * This maximises the minimum fulfilment ratio for a fixed set of growers.
 */
function waterFill(lower: number[], upper: number[], desired: number[], capacityU: number): number[] {
  const alloc = [...lower];
  const sumUpper = upper.reduce((s, x) => s + x, 0);
  let remaining = Math.min(capacityU, sumUpper) - lower.reduce((s, x) => s + x, 0);
  while (remaining >= STEP_UNITS) {
    let pick = -1;
    let pickRatio = Number.POSITIVE_INFINITY;
    for (let i = 0; i < alloc.length; i++) {
      if (alloc[i] + STEP_UNITS > upper[i]) continue;
      const ratio = alloc[i] / desired[i];
      if (ratio < pickRatio - 1e-12) {
        pick = i;
        pickRatio = ratio;
      }
    }
    if (pick === -1) break;
    alloc[pick] += STEP_UNITS;
    remaining -= STEP_UNITS;
  }
  return alloc;
}

interface Plan {
  indices: number[];
  ids: string[];
  alloc: number[];
  placements: number;
  allocatedU: number;
  openIssues: number;
  minFulfillmentBp: number;
}

/** Negative when `a` is the better plan. Lexicographic objective, then deterministic tie-break. */
function comparePlans(a: Plan, b: Plan): number {
  if (a.placements !== b.placements) return b.placements - a.placements;
  if (a.allocatedU !== b.allocatedU) return b.allocatedU - a.allocatedU;
  if (a.openIssues !== b.openIssues) return a.openIssues - b.openIssues;
  if (a.minFulfillmentBp !== b.minFulfillmentBp) return b.minFulfillmentBp - a.minFulfillmentBp;
  return a.ids.join(",").localeCompare(b.ids.join(","));
}

function toScore(p: Plan): PlanScore {
  return {
    placements: p.placements,
    allocatedAcres: toAcres(p.allocatedU),
    openIssues: p.openIssues,
    minFulfillment: p.minFulfillmentBp / 10000,
  };
}

function explainNotPlaced(label: string, best: Plan, including: Plan | undefined, warnings: string[]): string {
  if (!including) {
    return `${label} passed every individual check, but no feasible combination includes them (cultivable area, the owner's grower limit or an incompatible growing-practice pairing rules it out).`;
  }
  if (including.placements !== best.placements) {
    return `${label} is eligible, but any plan including them places at most ${including.placements} grower(s), versus ${best.placements} in the recommended plan. Not enough cultivable area for everyone's minimum plot.`;
  }
  if (including.allocatedU !== best.allocatedU) {
    return `${label} is eligible, but the best plan including them puts ${ac(including.allocatedU)} into cultivation, versus ${ac(best.allocatedU)} in the recommended plan.`;
  }
  if (including.openIssues !== best.openIssues) {
    return `${label} is eligible, but there isn't room for every eligible grower. Among plans with the same number of growers and acreage, the recommended one leaves fewer items needing confirmation (${best.openIssues} vs ${including.openIssues}).${warnings.length ? ` ${label}'s open items: ${warnings.join(" ")}` : ""}`;
  }
  if (including.minFulfillmentBp !== best.minFulfillmentBp) {
    return `${label} is eligible, but including them gives a less even split: the least-served grower would get ${Math.round(including.minFulfillmentBp / 100)}% of their desired area, versus ${Math.round(best.minFulfillmentBp / 100)}%.`;
  }
  return `${label} ties with the recommended plan on every objective; the tie was broken by a fixed ordering (grower ID). A coordinator may reasonably choose this alternative.`;
}

export function inputFingerprint(property: Property, candidates: Grower[]): string {
  const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
  return fnv1a(stableStringify({ engineVersion: ENGINE_VERSION, property, candidates: sorted }));
}

export function runAllocation(property: Property, candidates: Grower[]): AllocationResult {
  const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
  const fingerprint = inputFingerprint(property, sorted);
  const validationErrors = validateProperty(property);

  const totalU = toUnits(property.totalAcres);
  const cultivableU = toUnits(property.cultivableAcres);
  const reservedU = toUnits(property.reservedAcres);
  const baseTotals = {
    totalAcres: toAcres(totalU),
    cultivableAcres: toAcres(cultivableU),
    reservedAcres: toAcres(reservedU),
    otherAcres: toAcres(Math.max(0, totalU - cultivableU - reservedU)),
  };

  const assumptions = [
    "Acreage figures are reported by the owner and have not been surveyed.",
    "Land ownership and the right to lease have not been verified by Acre Circle.",
    `Rent uses the owner's stated rate of ${formatCurrency(property.rentPerAcreMonthly)} per acre per month; final terms are for the parties to negotiate.`,
    "Travel distances are approximate region-to-region estimates, not routed distances.",
    "Soil suitability, crop yields and income are not assessed by this engine.",
    "This allocation is a proposal for human review, not a decision or an agreement.",
  ];

  if (validationErrors.length) {
    return {
      engineVersion: ENGINE_VERSION,
      propertyId: property.id,
      inputFingerprint: fingerprint,
      valid: false,
      validationErrors,
      plots: [],
      evaluations: [],
      score: { placements: 0, allocatedAcres: 0, openIssues: 0, minFulfillment: 0 },
      alternatives: [],
      totals: { ...baseTotals, allocatedAcres: 0, unallocatedAcres: baseTotals.cultivableAcres },
      stats: { candidatesEvaluated: sorted.length, eligible: 0, deferred: 0, rejected: 0, combinationsExplored: 0, feasibleCombinations: 0, constraintChecks: 0 },
      openIssues: [],
      assumptions,
    };
  }

  const screened = sorted.map((g) => screenCandidate(property, g));
  let constraintChecks = screened.reduce((s, c) => s + c.checks.length, 0);

  const eligible = screened.filter((s) => s.status === "eligible").slice(0, MAX_SEARCH_CANDIDATES);
  const n = eligible.length;
  const capU = floorStep(cultivableU);

  const conflict: boolean[][] = eligible.map(() => new Array<boolean>(n).fill(false));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const c = practicesConflict(eligible[i].grower, eligible[j].grower);
      conflict[i][j] = c;
      conflict[j][i] = c;
      constraintChecks++;
    }
  }

  const emptyPlan: Plan = { indices: [], ids: [], alloc: [], placements: 0, allocatedU: 0, openIssues: 0, minFulfillmentBp: 0 };
  let best: Plan = emptyPlan;
  const top: Plan[] = [];
  const bestIncluding = new Map<string, Plan>();
  let feasibleCombinations = 0;
  const totalMasks = 1 << n;

  for (let mask = 1; mask < totalMasks; mask++) {
    constraintChecks++;
    const indices: number[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) indices.push(i);
    if (indices.length > property.maxGrowers) continue;

    let ok = true;
    for (let a = 0; a < indices.length && ok; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        if (conflict[indices[a]][indices[b]]) {
          ok = false;
          break;
        }
      }
    }
    if (!ok) continue;

    const lower = indices.map((i) => eligible[i].lowerU);
    if (lower.reduce((s, x) => s + x, 0) > capU) continue;
    feasibleCombinations++;

    const upper = indices.map((i) => eligible[i].upperU);
    const desired = indices.map((i) => eligible[i].desiredU);
    const alloc = waterFill(lower, upper, desired, capU);
    const plan: Plan = {
      indices,
      ids: indices.map((i) => eligible[i].grower.id),
      alloc,
      placements: indices.length,
      allocatedU: alloc.reduce((s, x) => s + x, 0),
      openIssues: indices.reduce((s, i) => s + eligible[i].warnCount, 0),
      minFulfillmentBp: Math.min(...alloc.map((x, k) => Math.floor((x * 10000) / desired[k]))),
    };

    if (comparePlans(plan, best) < 0 || best === emptyPlan) best = plan;
    for (const id of plan.ids) {
      const prev = bestIncluding.get(id);
      if (!prev || comparePlans(plan, prev) < 0) bestIncluding.set(id, plan);
    }
    top.push(plan);
    top.sort(comparePlans);
    if (top.length > 4) top.pop();
  }

  const placedOrder = best.indices
    .map((idx, k) => ({ s: eligible[idx], units: best.alloc[k] }))
    .sort((a, b) => b.units - a.units || a.s.grower.id.localeCompare(b.s.grower.id));

  const plots: PlotAllocation[] = placedOrder.map(({ s, units }, k) => ({
    plotId: String.fromCharCode(65 + k),
    growerId: s.grower.id,
    acres: toAcres(units),
    monthlyRent: Math.round(toAcres(units) * property.rentPerAcreMonthly * 100) / 100,
    fulfillment: units / s.desiredU,
  }));
  const plotByGrower = new Map(plots.map((p) => [p.growerId, p]));

  const evaluations: CandidateEvaluation[] = screened.map((s) => {
    const plot = plotByGrower.get(s.grower.id);
    const bounds = s.status !== "rejected" ? { lower: toAcres(s.lowerU), upper: toAcres(s.upperU) } : undefined;
    if (plot) {
      const reduced = plot.acres < s.grower.desiredAcres;
      return {
        growerId: s.grower.id,
        status: "placed",
        checks: s.checks,
        bounds,
        allocatedAcres: plot.acres,
        monthlyRent: plot.monthlyRent,
        plotId: plot.plotId,
        summary: `Proposed for Plot ${plot.plotId}: ${plot.acres.toFixed(2)} ac${reduced ? ` of the ${s.grower.desiredAcres.toFixed(2)} ac requested` : ", the full area requested"}, at about ${formatCurrency(plot.monthlyRent)}/mo against a ${formatCurrency(s.grower.budgetMonthly)}/mo budget.`,
      };
    }
    if (s.status === "eligible") {
      return {
        growerId: s.grower.id,
        status: "not-placed",
        checks: s.checks,
        bounds,
        summary: explainNotPlaced(
          s.grower.label,
          best,
          bestIncluding.get(s.grower.id),
          s.checks.filter((c) => c.status === "warn").map((c) => c.detail),
        ),
      };
    }
    const key = s.status === "deferred" ? "pending" : "fail";
    const reasons = s.checks.filter((c) => c.status === key).map((c) => c.detail);
    return {
      growerId: s.grower.id,
      status: s.status,
      checks: s.checks,
      bounds,
      summary: reasons.join(" "),
    };
  });

  const growerById = new Map(sorted.map((g) => [g.id, g]));
  const openIssues: string[] = [];
  for (const e of evaluations) {
    const g = growerById.get(e.growerId)!;
    if (e.status === "placed") {
      for (const c of e.checks.filter((c) => c.status === "warn")) openIssues.push(`${g.label} (Plot ${e.plotId}): ${c.detail}`);
    } else if (e.status === "deferred") {
      openIssues.push(`${g.label} deferred: ${e.summary}`);
    }
  }
  if (!property.soilTested) openIssues.push("No laboratory soil test on file for this property.");

  const allocatedU = best.allocatedU;
  return {
    engineVersion: ENGINE_VERSION,
    propertyId: property.id,
    inputFingerprint: fingerprint,
    valid: true,
    validationErrors: [],
    plots,
    evaluations,
    score: toScore(best),
    alternatives: top
      .filter((p) => p !== best)
      .slice(0, 3)
      .map<CandidatePlan>((p) => ({ growerIds: p.ids, score: toScore(p) })),
    totals: {
      ...baseTotals,
      allocatedAcres: toAcres(allocatedU),
      unallocatedAcres: toAcres(cultivableU - allocatedU),
    },
    stats: {
      candidatesEvaluated: sorted.length,
      eligible: screened.filter((s) => s.status === "eligible").length,
      deferred: screened.filter((s) => s.status === "deferred").length,
      rejected: screened.filter((s) => s.status === "rejected").length,
      combinationsExplored: Math.max(0, totalMasks - 1),
      feasibleCombinations,
      constraintChecks,
    },
    openIssues,
    assumptions,
  };
}
