"use client";

import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, Clock, X } from "lucide-react";
import type { CandidateEvaluation, CheckStatus, ConstraintCheck, Grower } from "@/lib/types";
import { formatCurrency } from "@/lib/labels";
import { Badge, cn } from "./ui";
import { PLOT_COLORS } from "./plot-map";

export function statusBadge(e: CandidateEvaluation) {
  switch (e.status) {
    case "placed":
      return <Badge tone="sage">Placed · Plot {e.plotId}</Badge>;
    case "not-placed":
      return <Badge tone="gold">Eligible · not placed</Badge>;
    case "deferred":
      return <Badge tone="warn">Deferred · needs verification</Badge>;
    case "rejected":
      return <Badge tone="danger">Not compatible</Badge>;
  }
}

export function CheckIcon({ status, className }: { status: CheckStatus; className?: string }) {
  const map = {
    pass: { Icon: Check, cls: "bg-sage-soft text-forest" },
    warn: { Icon: AlertTriangle, cls: "bg-warn-soft text-warn" },
    pending: { Icon: Clock, cls: "bg-warn-soft text-warn" },
    fail: { Icon: X, cls: "bg-danger-soft text-danger" },
  }[status];
  return (
    <span className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full", map.cls, className)} aria-label={status}>
      <map.Icon className="h-3 w-3" strokeWidth={2.5} />
    </span>
  );
}

const CHECK_ORDER: Record<CheckStatus, number> = { fail: 0, warn: 1, pending: 2, pass: 3 };

export const checkKey = (c: ConstraintCheck) => `${c.id}|${c.detail}`;

/**
 * Lists what needs attention and folds passing checks behind a toggle.
 * `omit` hides checks already shown elsewhere on the page (e.g. property-wide concerns).
 */
export function CheckList({ checks, omit, className }: { checks: ConstraintCheck[]; omit?: Set<string>; className?: string }) {
  const [showPassing, setShowPassing] = useState(false);
  const sorted = [...checks].sort((a, b) => CHECK_ORDER[a.status] - CHECK_ORDER[b.status]);
  const issues = sorted.filter((c) => c.status !== "pass" && !omit?.has(checkKey(c)));
  const omitted = sorted.filter((c) => c.status !== "pass" && omit?.has(checkKey(c))).length;
  const passing = sorted.filter((c) => c.status === "pass");
  const row = (c: ConstraintCheck) => (
    <li key={c.id} className="flex gap-2.5 text-[12.5px] leading-snug">
      <CheckIcon status={c.status} className="mt-px" />
      <span>
        <span className="font-medium text-ink">{c.label}.</span> <span className="text-ink/75">{c.detail}</span>
      </span>
    </li>
  );
  return (
    <div className={className}>
      <p className="text-[12px] text-muted">
        {passing.length} of {checks.length} checks pass{omitted > 0 ? ` · ${omitted} shared item${omitted === 1 ? "" : "s"} noted above` : ""}
      </p>
      {issues.length > 0 && <ul className="mt-2 space-y-1.5">{issues.map(row)}</ul>}
      {passing.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowPassing((s) => !s)}
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-forest hover:underline"
            aria-expanded={showPassing}
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showPassing && "rotate-180")} />
            {showPassing ? "Hide" : "Show"} {passing.length} passing check{passing.length === 1 ? "" : "s"}
          </button>
          {showPassing && <ul className="mt-2 space-y-1.5">{passing.map(row)}</ul>}
        </>
      )}
    </div>
  );
}

export function CandidateCard({ grower, evaluation, plotIndex }: { grower: Grower; evaluation: CandidateEvaluation; plotIndex: number }) {
  const color = evaluation.status === "placed" ? PLOT_COLORS[plotIndex % PLOT_COLORS.length] : undefined;
  return (
    <div
      className={cn(
        "rounded-2xl border bg-paper p-4 transition-shadow hover:shadow-soft",
        evaluation.status === "placed" ? "border-sage" : evaluation.status === "rejected" ? "border-danger/20" : "border-line",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-serif text-lg font-semibold",
            color ? "text-paper" : "bg-cream text-muted",
          )}
          style={color ? { background: color } : undefined}
        >
          {evaluation.plotId ?? grower.label.replace("Grower ", "")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium text-forest">{grower.label}</h4>
            {statusBadge(evaluation)}
            <span className="ml-auto text-[12px] text-muted">
              {evaluation.allocatedAcres !== undefined ? (
                <span className="font-medium text-forest">{evaluation.allocatedAcres.toFixed(2)} ac</span>
              ) : (
                `wants ${grower.desiredAcres.toFixed(2)} ac`
              )}{" "}
              · {formatCurrency(grower.budgetMonthly)}/mo budget
            </span>
          </div>
          <p className="truncate text-[13px] text-muted">
            {grower.name} · {grower.cropType}
          </p>
          {evaluation.status !== "placed" && <p className="mt-1.5 text-[13px] leading-relaxed text-ink/85">{evaluation.summary}</p>}
          <CheckList checks={evaluation.checks} className="mt-2" />
        </div>
      </div>
    </div>
  );
}
