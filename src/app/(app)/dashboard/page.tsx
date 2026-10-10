"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Check, ClipboardList, FileSignature, HelpCircle, LandPlot, LayoutGrid, Send, Sprout } from "lucide-react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/app-shell";
import { IssueList } from "@/components/issue-list";
import { CountUp } from "@/components/motion";
import { Badge, ButtonLink, Card, cn, Stat } from "@/components/ui";
import { candidatesFor, runAllocation } from "@/lib/engine/allocate";
import { groupOpenIssues } from "@/lib/issues";
import { DURATION, EASE } from "@/lib/motion";
import { REQUEST_STATUS_LABELS } from "@/lib/requests";
import { useDemoStore } from "@/lib/store";
import type { PlotRequest, Property } from "@/lib/types";

const PIPELINE: { status: PlotRequest["status"]; color: string }[] = [
  { status: "sent", color: "bg-gold" },
  { status: "viewed", color: "bg-sage" },
  { status: "accepted", color: "bg-forest" },
  { status: "declined", color: "bg-danger/70" },
];

const STATUS_BADGE: Record<Property["listingStatus"], { tone: "sage" | "gold" | "neutral"; label: string }> = {
  ready: { tone: "sage", label: "Ready" },
  "in-review": { tone: "gold", label: "In review" },
  draft: { tone: "neutral", label: "Draft" },
};

function RequestPipeline({ requests }: { requests: PlotRequest[] }) {
  const total = requests.length;
  return (
    <Card className="mt-5 p-5" data-testid="request-pipeline">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-medium text-forest">
          <Send className="h-4 w-4" /> Plot requests
        </h3>
        <Link href="/inbox" className="inline-flex items-center gap-1 text-[13px] text-forest hover:underline">
          Open inbox <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-line" aria-hidden>
        {PIPELINE.map(({ status, color }) => {
          const n = requests.filter((r) => r.status === status).length;
          return (
            <motion.div
              key={status}
              className={color}
              initial={{ width: 0 }}
              animate={{ width: total ? `${(n / total) * 100}%` : 0 }}
              transition={{ duration: DURATION.extraLong, ease: EASE.emphasizedDecelerate }}
            />
          );
        })}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        {PIPELINE.map(({ status, color }) => (
          <div key={status} className="flex items-baseline justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-[12.5px] text-muted">
              <span className={cn("h-2 w-2 rounded-full", color)} /> {REQUEST_STATUS_LABELS[status]}
            </dt>
            <dd className="font-serif text-xl text-forest">
              <CountUp value={requests.filter((r) => r.status === status).length} />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default function DashboardPage() {
  const { state, setActiveProperty } = useDemoStore();

  const rows = useMemo(
    () =>
      state.properties.map((p) => {
        const candidates = candidatesFor(p, state.growers);
        const result = runAllocation(p, candidates);
        return { property: p, candidates, result, issues: groupOpenIssues(result, state.growers, p.soilTested) };
      }),
    [state.properties, state.growers],
  );

  const provisional = rows.reduce((s, r) => s + r.result.plots.length, 0);
  const acres = rows.reduce((s, r) => s + r.result.totals.allocatedAcres, 0);
  const agreements = Object.values(state.agreements);
  const inReview = agreements.filter((a) => a.status === "in-review").length;
  const drafted = agreements.length;
  const growerIssues = rows.map((r) => ({ ...r, groups: r.issues.filter((g) => g.kind !== "property") })).filter((r) => r.groups.length > 0);
  const untested = rows.filter((r) => !r.property.soilTested).map((r) => r.property.name);
  const toConfirm = growerIssues.reduce((s, r) => s + r.groups.length, 0) + (untested.length ? 1 : 0);

  const hv = rows.find((r) => r.property.id === "harbour-valley") ?? rows[0];
  const hvHasRun = !!state.results[hv.property.id];
  const hvDeferredWater = hv.result.evaluations.some((e) => e.status === "deferred");
  const hvAgreement = agreements.some((a) => a.propertyId === hv.property.id);

  const workflow = [
    { label: `Review ${hv.property.name} listing`, href: `/landowner?property=${hv.property.id}`, done: true },
    { label: `Review ${hv.candidates.length} interested growers`, href: "/growers", done: true },
    { label: "Run the cooperative plot optimizer", href: "/optimizer", done: hvHasRun },
    { label: `Review ${hv.result.plots.length} proposed placements`, href: "/optimizer", done: hvHasRun },
    { label: hvDeferredWater ? "Flag outstanding water / irrigation verification" : "Confirm infrastructure verification", href: "/optimizer", done: hvHasRun },
    { label: "Open a draft agreement for a selected match", href: "/agreements", done: hvAgreement },
  ];

  return (
    <div>
      <PageHeader
        title="Valley Land Access Cooperative"
        description="Listings, requests and plot plans across the cooperative."
        actions={
          <ButtonLink href="/optimizer">
            <LayoutGrid className="h-4 w-4" /> Run optimizer
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-testid="dashboard-kpis">
        <Stat
          label="Active listings"
          value={state.properties.length}
          hint={`${state.properties.filter((p) => p.listingStatus === "ready").length} ready for matching`}
          icon={<LandPlot className="h-4 w-4" />}
        />
        <Stat label="Provisional matches" value={provisional} hint={`${acres.toFixed(2)} ac proposed, not agreed`} icon={<Sprout className="h-4 w-4" />} />
        <Stat label="Agreements awaiting review" value={inReview} hint={`${drafted} draft${drafted === 1 ? "" : "s"} started`} icon={<FileSignature className="h-4 w-4" />} />
        <Stat label="Items to confirm" value={toConfirm} hint="Water, soil and fit questions" icon={<HelpCircle className="h-4 w-4" />} />
      </div>

      <RequestPipeline requests={state.requests} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="font-medium text-forest">Listings</h3>
            <Link href="/explore" className="text-[13px] text-forest hover:underline">
              Explore all
            </Link>
          </div>
          <table className="hidden w-full text-left text-[13px] md:table">
            <thead className="bg-cream/70 text-[12px] text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Property</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Applicants</th>
                <th className="px-3 py-2.5 text-right font-medium">Placed</th>
                <th className="px-3 py-2.5 text-right font-medium">Allocated</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ property: p, candidates, result }) => (
                <tr key={p.id} className="border-t border-line hover:bg-cream/40">
                  <td className="px-5 py-3">
                    <Link href={`/landowner?property=${p.id}`} className="font-medium text-forest hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-[12px] text-muted">
                      {p.region} · {p.cultivableAcres.toFixed(2)} ac
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={STATUS_BADGE[p.listingStatus].tone}>{STATUS_BADGE[p.listingStatus].label}</Badge>
                  </td>
                  <td className="px-3 py-3 text-right">{candidates.length}</td>
                  <td className="px-3 py-3 text-right font-medium">{result.plots.length}</td>
                  <td className="px-3 py-3 text-right">{result.totals.allocatedAcres.toFixed(2)} ac</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href="/optimizer"
                      onClick={() => setActiveProperty(p.id)}
                      className="inline-flex items-center gap-1 text-[12.5px] font-medium text-forest hover:underline"
                    >
                      Optimize <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-line md:hidden">
            {rows.map(({ property: p, candidates, result }) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/landowner?property=${p.id}`} className="font-medium text-forest">
                    {p.name}
                  </Link>
                  <p className="text-[12px] text-muted">
                    {candidates.length} applicant{candidates.length === 1 ? "" : "s"} · {result.plots.length} placed · {result.totals.allocatedAcres.toFixed(2)} ac
                  </p>
                </div>
                <Badge tone={STATUS_BADGE[p.listingStatus].tone}>{STATUS_BADGE[p.listingStatus].label}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-medium text-forest">
            <ClipboardList className="h-4 w-4" /> Next steps: {hv.property.name}
          </h3>
          <ol className="mt-4 space-y-2">
            {workflow.map((w, i) => (
              <li key={w.label}>
                <Link href={w.href} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-[13px] transition-colors hover:border-forest/30 hover:bg-cream/50">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      w.done ? "bg-forest text-paper" : "border border-line-strong text-muted",
                    )}
                  >
                    {w.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={cn("flex-1", w.done ? "text-ink" : "text-ink/80")}>{w.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted" />
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="mt-5 p-5" data-testid="readiness">
        <h3 className="font-medium text-forest">To confirm before anyone signs</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          {growerIssues.map((r) => (
            <div key={r.property.id}>
              <p className="mb-2 text-[12.5px] font-semibold text-gold-deep">{r.property.name}</p>
              <IssueList groups={r.groups} />
            </div>
          ))}
          {untested.length > 0 && (
            <div>
              <p className="mb-2 text-[12.5px] font-semibold text-gold-deep">No laboratory soil test on file</p>
              <div className="flex flex-wrap gap-1.5">
                {untested.map((name) => (
                  <Badge key={name} tone="neutral">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
