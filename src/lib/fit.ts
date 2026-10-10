import { runAllocation } from "./engine/allocate";
import type { CandidateEvaluation, Grower, Property } from "./types";

export type FitLevel = "good" | "confirm" | "no";

export interface Fit {
  level: FitLevel;
  label: string;
  evaluation: CandidateEvaluation | null;
}

/**
 * How well one grower fits one property, using the same engine as the
 * optimizer (a single-candidate run), so the map never disagrees with the plan.
 */
export function fitFor(property: Property, grower: Grower): Fit {
  const asApplicant = { ...grower, interestedPropertyIds: [property.id] };
  const result = runAllocation(property, [asApplicant]);
  const evaluation = result.evaluations.find((e) => e.growerId === grower.id) ?? null;
  if (!result.valid || !evaluation) return { level: "no", label: "Listing incomplete", evaluation };
  switch (evaluation.status) {
    case "placed":
    case "not-placed":
      return { level: "good", label: "Good fit", evaluation };
    case "deferred":
      return { level: "confirm", label: "Needs confirmation", evaluation };
    case "rejected":
      return { level: "no", label: "Not a fit", evaluation };
  }
}

export const FIT_TONE: Record<FitLevel, "sage" | "gold" | "danger"> = { good: "sage", confirm: "gold", no: "danger" };
