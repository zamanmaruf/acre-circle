"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  FileSignature,
  HelpCircle,
  LandPlot,
  LayoutGrid,
  Ruler,
  Send,
  Sprout,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/app-shell";
import { CountUp } from "@/components/motion";
import { Badge, ButtonLink, Card, cn, Stat, SyntheticBadge } from "@/components/ui";
import { candidatesFor, runAllocation } from "@/lib/engine/allocate";
import { DURATION, EASE } from "@/lib/motion";
import { REQUEST_STATUS_LABELS } from "@/lib/requests";
import { useDemoStore } from "@/lib/store";
import type { PlotRequest } from "@/lib/types";

const PIPELINE: { status: PlotRequest["status"]; color: string }[] = [
  { status: "sent", color: "bg-gold" },
  { status: "viewed", color: "bg-sage" },
  { status: "accepted", color: "bg-forest" },
  { status: "declined", color: "bg-danger/70" },
];

function RequestPipeline({ requests }: { requests: PlotRequest[] }) {
  const total = requests.length;
  return (
    <Card className="mt-6 p-5" data-testid="request-pipeline">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-medium text-forest">
          <Send className="h-4 w-4" /> Plot request pipeline
        </h3>
        <Link href="/inbox" className="inline-flex items-center gap-1 text-[13px] text-forest hover:underline">
          Open inbox <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-line" aria-hidden>
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
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PIPELINE.map(({ status, color }) => (
          <div key={status} className="rounded-xl bg-cream/70 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <span className={cn("h-2 w-2 rounded-full", color)} /> {REQUEST_STATUS_LABELS[status]}
            </dt>
            <dd className="font-serif text-xl text-forest">
              <CountUp value={requests.filter((r) => r.status === status).length} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[12px] text-muted">
        {total === 0 ? "No requests yet." : `${total} request${total === 1 ? "" : "s"} in this browser's demo data.`} Accepted requests add the grower as an applicant
        for the optimizer.
      </p>
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
        return { property: p, candidates, result };
      }),
    [state.properties, state.growers],
  );

  const provisional = rows.reduce((s, r) => s + r.result.plots.length, 0);
  const acres = rows.reduce((s, r) => s + r.result.totals.allocatedAcres, 0);
  const reserved = rows.reduce((s, r) => s + (r.result.plots.length ? r.result.totals.reservedAcres : 0), 0);
  const openIssues = rows.reduce((s, r) => s + r.result.openIssues.length, 0);
  const evaluated = rows.reduce((s, r) => s + r.result.stats.candidatesEvaluated, 0);
  const checks = rows.reduce((s, r) => s + r.result.stats.constraintChecks, 0);
  const agreements = Object.values(state.agreements);
  const inReview = agreements.filter((a) => a.status === "in-review").length;
  const drafted = agreements.length;
  const growersApplying = state.growers.filter((g) => g.interestedPropertyIds.length > 0).length;

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
        eyebrow="Organization workspace"
        title="Valley Land Access Cooperative"
        description="A fictional agricultural cooperative coordinating land-sharing in Nova Scotia. Every figure on this page is calculated live from the synthetic demo dataset. None of it is real traction."
        actions={
          <>
            <SyntheticBadge />
            <ButtonLink href="/optimizer">
              <LayoutGrid className="h-4 w-4" /> Run optimizer
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6" data-testid="dashboard-kpis">
        <Stat label="Active property listings" value={state.properties.length} hint={`${state.properties.filter((p) => p.listingStatus === "ready").length} ready for matching`} icon={<LandPlot className="h-4 w-4" />} />
        <Stat label="Registered growers" value={state.growers.length} hint={`${growersApplying} applying to a property`} icon={<Users className="h-4 w-4" />} />
        <Stat label="Provisional matches" value={provisional} hint="Proposed plots, not agreements" icon={<Sprout className="h-4 w-4" />} />
        <Stat label="Acres proposed" value={acres.toFixed(2)} hint="Across all listings" icon={<Ruler className="h-4 w-4" />} />
        <Stat label="Agreements awaiting review" value={inReview} hint={`${drafted} draft${drafted === 1 ? "" : "s"} started`} icon={<FileSignature className="h-4 w-4" />} />
        <Stat label="Open readiness questions" value={openIssues} hint="Water, soil and fit items to confirm" icon={<HelpCircle className="h-4 w-4" />} />
      </div>

      <RequestPipeline requests={state.requests} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="font-medium text-forest">Property listings</h3>
            <Link href="/explore" className="text-[13px] text-forest hover:underline">
              Explore all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="bg-cream/70 text-[12px] text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Property</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">Cultivable</th>
                  <th className="px-3 py-2.5 text-right font-medium">Applicants</th>
                  <th className="px-3 py-2.5 text-right font-medium">Placed</th>
                  <th className="px-3 py-2.5 text-right font-medium">Allocated</th>
                  <th className="px-3 py-2.5 text-right font-medium">Open items</th>
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
                      <p className="text-[12px] text-muted">{p.region}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={p.listingStatus === "ready" ? "sage" : p.listingStatus === "in-review" ? "gold" : "neutral"}>
                        {p.listingStatus === "ready" ? "Ready" : p.listingStatus === "in-review" ? "In review" : "Draft"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right">{p.cultivableAcres.toFixed(2)} ac</td>
                    <td className="px-3 py-3 text-right">{candidates.length}</td>
                    <td className="px-3 py-3 text-right font-medium">{result.plots.length}</td>
                    <td className="px-3 py-3 text-right">{result.totals.allocatedAcres.toFixed(2)} ac</td>
                    <td className="px-3 py-3 text-right">{result.openIssues.length}</td>
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
          </div>
          <p className="border-t border-line px-5 py-3 text-[12px] text-muted">
            Properties without applicants show zero placements. Invite growers to apply from the Growers page.
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-medium text-forest">
            <ClipboardList className="h-4 w-4" /> Coordinator workflow: {hv.property.name}
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-medium text-forest">Unresolved land-readiness questions</h3>
          <div className="mt-3 space-y-4">
            {rows
              .filter((r) => r.result.openIssues.length > 0)
              .map((r) => (
                <div key={r.property.id}>
                  <p className="text-[12.5px] font-semibold text-gold-deep">{r.property.name}</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {r.result.openIssues.map((i) => (
                      <li key={i} className="flex gap-2 text-[13px] text-ink/85">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-forest">Demo measurements</h3>
              <Badge tone="info">Synthetic demo, not pilot results</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Candidates evaluated", evaluated],
                ["Provisionally matched", provisional],
                ["Acres allocated", acres.toFixed(2)],
                ["Acres reserved for shared use", reserved.toFixed(2)],
                ["Constraint checks run", checks],
                ["Unresolved items flagged", openIssues],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-xl bg-cream/70 px-3 py-2.5">
                  <dt className="text-[11.5px] text-muted">{k}</dt>
                  <dd className="font-serif text-xl text-forest">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="rounded-2xl bg-forest-deep p-5 text-paper shadow-soft">
            <h3 className="flex items-center gap-2 font-medium">
              <Building2 className="h-4 w-4 text-gold" /> Why an organization would subscribe
            </h3>
            <ul className="mt-3 space-y-2 text-[13.5px] text-paper/80">
              <li>• One workspace for listings, applicants, plot plans and agreement drafts</li>
              <li>• Re-plan in seconds when budgets, land or infrastructure change</li>
              <li>• Transparent reasons for every placement, deferral and rejection</li>
              <li>• Readiness checklist so nothing unverified reaches an agreement</li>
            </ul>
            <p className="mt-4 text-[12px] text-paper/55">
              Proposed model: organizations pay a subscription; landowners and growers join free. Pricing is a hypothesis to test with partners, not validated
              revenue.
            </p>
            <p className="mt-3 text-[12px] text-paper/55">
              In a real pilot we would measure coordination time per placement, match-to-agreement rate, acres brought into cultivation, participation and
              satisfaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
