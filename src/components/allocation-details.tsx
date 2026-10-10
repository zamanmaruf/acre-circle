"use client";

import type { AllocationResult, Grower, Property } from "@/lib/types";
import { OBJECTIVE_DESCRIPTION } from "@/lib/engine/explain";
import { MAX_SEARCH_CANDIDATES } from "@/lib/engine/allocate";
import { formatCurrency } from "@/lib/labels";
import { CheckIcon, statusBadge } from "./candidate-card";

const CHECK_COLUMNS = [
  { id: "activity", label: "Activity" },
  { id: "season", label: "Season" },
  { id: "vehicle", label: "Vehicle" },
  { id: "travel", label: "Travel" },
  { id: "water", label: "Water" },
  { id: "plot-size", label: "Plot size" },
  { id: "budget", label: "Budget" },
  { id: "capacity", label: "Area" },
  { id: "equipment", label: "Facilities" },
];

export function AllocationDetails({ result, growers, property }: { result: AllocationResult; growers: Grower[]; property: Property }) {
  const byId = new Map(growers.map((g) => [g.id, g]));
  const label = (id: string) => byId.get(id)?.label ?? id;
  return (
    <div className="space-y-7 text-[13px]">
      <section>
        <h3 className="font-medium text-forest">How the plan was chosen</h3>
        <p className="mt-1 leading-relaxed text-ink/80">
          Each applicant is screened against hard constraints (permitted activity, season, vehicle access, travel, water, plot-size limits, budget and
          cultivable area). Applicants whose essential infrastructure is unverified are <strong>deferred</strong>, not promised. The engine then
          evaluates <strong>every</strong> combination of eligible applicants ({result.stats.combinationsExplored} combinations,{" "}
          {result.stats.feasibleCombinations} feasible), enforcing total cultivable area, the owner&apos;s grower limit, each grower&apos;s minimum and
          maximum plot, and growing-practice compatibility. Plot sizes move in 0.05-acre steps.
        </p>
        <p className="mt-2 rounded-xl bg-sage-soft/60 px-3 py-2 leading-relaxed text-forest">
          <strong>Objective (in priority order):</strong> {OBJECTIVE_DESCRIPTION}
        </p>
        <p className="mt-2 leading-relaxed text-muted">
          Because the search is exhaustive over combinations (up to {MAX_SEARCH_CANDIDATES} eligible applicants) and plot sizing for a fixed group is
          solved exactly, the recommended plan is optimal for this objective and this simplified model. It is not a judgement about real-world
          suitability.
        </p>
      </section>

      <section>
        <h3 className="mb-2 font-medium text-forest">Proposed plots</h3>
        {result.plots.length === 0 ? (
          <p className="text-muted">No plots proposed.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-cream text-[12px] text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Plot</th>
                  <th className="px-3 py-2 font-medium">Grower</th>
                  <th className="px-3 py-2 text-right font-medium">Allocated</th>
                  <th className="px-3 py-2 text-right font-medium">Requested</th>
                  <th className="px-3 py-2 text-right font-medium">Rent / mo</th>
                  <th className="px-3 py-2 text-right font-medium">Budget / mo</th>
                </tr>
              </thead>
              <tbody>
                {result.plots.map((p) => {
                  const g = byId.get(p.growerId);
                  return (
                    <tr key={p.growerId} className="border-t border-line">
                      <td className="px-3 py-2 font-medium text-forest">{p.plotId}</td>
                      <td className="px-3 py-2">
                        {g?.label} <span className="text-muted">· {g?.cropType}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-medium">{p.acres.toFixed(2)} ac</td>
                      <td className="px-3 py-2 text-right text-muted">{g?.desiredAcres.toFixed(2)} ac</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(p.monthlyRent)}</td>
                      <td className="px-3 py-2 text-right text-muted">{g ? formatCurrency(g.budgetMonthly) : "—"}</td>
                    </tr>
                  );
                })}
                <tr className="border-t border-line bg-cream/60 font-medium">
                  <td className="px-3 py-2" colSpan={2}>
                    Total ({property.rentPerAcreMonthly ? `${formatCurrency(property.rentPerAcreMonthly)}/ac/mo` : "no rent"})
                  </td>
                  <td className="px-3 py-2 text-right">{result.totals.allocatedAcres.toFixed(2)} ac</td>
                  <td className="px-3 py-2 text-right text-muted">of {result.totals.cultivableAcres.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(result.plots.reduce((s, p) => s + p.monthlyRent, 0))}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-medium text-forest">Constraint matrix</h3>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-cream text-[12px] text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Applicant</th>
                {CHECK_COLUMNS.map((c) => (
                  <th key={c.id} className="px-2 py-2 text-center font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {result.evaluations.map((e) => (
                <tr key={e.growerId} className="border-t border-line">
                  <td className="px-3 py-2 font-medium">{label(e.growerId)}</td>
                  {CHECK_COLUMNS.map((c) => {
                    const check = e.checks.find((x) => x.id === c.id);
                    return (
                      <td key={c.id} className="px-2 py-2 text-center" title={check?.detail}>
                        {check ? <CheckIcon status={check.status} className="mx-auto" /> : <span className="text-muted">–</span>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2">{statusBadge(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11.5px] text-muted">Hover a cell for the reason. Amber = holds but needs confirmation or discussion; clock = deferred pending verification.</p>
      </section>

      {result.alternatives.length > 0 && (
        <section>
          <h3 className="mb-2 font-medium text-forest">Next-best combinations considered</h3>
          <ul className="space-y-1.5">
            {result.alternatives.map((a) => (
              <li key={a.growerIds.join()} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                <span>{a.growerIds.map(label).join(" + ")}</span>
                <span className="text-muted">
                  {a.score.placements} placed · {a.score.allocatedAcres.toFixed(2)} ac · {a.score.openIssues} open issues · least-served{" "}
                  {Math.round(a.score.minFulfillment * 100)}%
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11.5px] text-muted">
            Recommended: {result.score.placements} placed · {result.score.allocatedAcres.toFixed(2)} ac · {result.score.openIssues} open issues · least-served{" "}
            {Math.round(result.score.minFulfillment * 100)}%
          </p>
        </section>
      )}

      <section className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-medium text-forest">Requires real-world review</h3>
          <ul className="list-disc space-y-1 pl-5 text-ink/80">
            {result.openIssues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-medium text-forest">Assumptions</h3>
          <ul className="list-disc space-y-1 pl-5 text-ink/80">
            {result.assumptions.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </section>

      <p className="border-t border-line pt-3 text-[11.5px] text-muted">
        Engine v{result.engineVersion} · input fingerprint {result.inputFingerprint} · {result.stats.constraintChecks} constraint evaluations. The same inputs
        always produce the same plan and fingerprint.
      </p>
    </div>
  );
}
