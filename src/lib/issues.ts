import type { AllocationResult, CandidateEvaluation, Grower } from "./types";

export interface IssueGroup {
  key: string;
  text: string;
  /** Grower labels this issue applies to; empty for property-wide items. */
  growers: string[];
  kind: "verify" | "deferred" | "property";
}

/**
 * Display grouping of the engine's open issues. Covers exactly the items in `result.openIssues`,
 * but merges identical warnings that apply to several placed growers into one row.
 */
export function groupOpenIssues(result: AllocationResult, growers: Grower[], soilTested: boolean): IssueGroup[] {
  const label = new Map(growers.map((g) => [g.id, g.label]));
  const groups = new Map<string, IssueGroup>();
  for (const e of result.evaluations) {
    const who = label.get(e.growerId) ?? e.growerId;
    if (e.status === "placed") {
      for (const c of e.checks.filter((c) => c.status === "warn")) {
        const key = `${c.id}|${c.detail}`;
        const g = groups.get(key) ?? { key, text: c.detail, growers: [], kind: "verify" as const };
        g.growers.push(who);
        groups.set(key, g);
      }
    } else if (e.status === "deferred") {
      groups.set(`deferred|${e.growerId}`, { key: `deferred|${e.growerId}`, text: e.summary, growers: [who], kind: "deferred" });
    }
  }
  const out = [...groups.values()];
  if (!soilTested) out.push({ key: "soil", text: "No laboratory soil test on file for this property.", growers: [], kind: "property" });
  return out;
}

/** Non-passing checks that are identical for two or more applicants, i.e. facts about the property rather than the grower. */
export function sharedConcerns(evaluations: CandidateEvaluation[]): { key: string; label: string; detail: string; count: number }[] {
  const counts = new Map<string, { key: string; label: string; detail: string; count: number }>();
  for (const e of evaluations) {
    for (const c of e.checks) {
      if (c.status === "pass" || c.status === "fail") continue;
      const key = `${c.id}|${c.detail}`;
      const entry = counts.get(key) ?? { key, label: c.label, detail: c.detail, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].filter((c) => c.count >= 2);
}

export function formatGrowerList(labels: string[]): string {
  if (labels.length === 0) return "";
  const short = labels.map((l) => l.replace(/^Grower /, ""));
  if (labels.length === 1) return labels[0];
  return `Growers ${short.slice(0, -1).join(", ")} and ${short[short.length - 1]}`;
}
