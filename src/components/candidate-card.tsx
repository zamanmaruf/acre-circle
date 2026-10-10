"use client";

import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, Clock, X } from "lucide-react";
import type { CandidateEvaluation, CheckStatus, Grower } from "@/lib/types";
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

export function CandidateCard({ grower, evaluation, plotIndex }: { grower: Grower; evaluation: CandidateEvaluation; plotIndex: number }) {
  const [open, setOpen] = useState(false);
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
          </div>
          <p className="truncate text-[13px] text-muted">
            {grower.name} · {grower.cropType}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink/85">{evaluation.summary}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
            <span>Requested {grower.desiredAcres.toFixed(2)} ac (min {grower.minAcres.toFixed(2)})</span>
            <span>Budget {formatCurrency(grower.budgetMonthly)}/mo</span>
            {evaluation.allocatedAcres !== undefined && (
              <span className="font-medium text-forest">Allocated {evaluation.allocatedAcres.toFixed(2)} ac</span>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-3 flex items-center gap-1 text-[12.5px] font-medium text-forest hover:underline"
        aria-expanded={open}
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        {open ? "Hide" : "View"} match explanation ({evaluation.checks.length} checks)
      </button>
      {open && (
        <ul className="mt-3 space-y-2 border-t border-line pt-3">
          {evaluation.checks.map((c) => (
            <li key={c.id} className="flex gap-2.5 text-[12.5px]">
              <CheckIcon status={c.status} className="mt-0.5" />
              <div>
                <span className="font-medium text-ink">{c.label}.</span> <span className="text-muted">{c.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
