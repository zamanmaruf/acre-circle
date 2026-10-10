"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Calculator,
  CircleAlert,
  Droplets,
  FileSignature,
  Gauge,
  ListChecks,
  MousePointerClick,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Ruler,
  SlidersHorizontal,
  Undo2,
  Users,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { CandidateCard, CheckIcon } from "@/components/candidate-card";
import { ExplanationPanel } from "@/components/explanation-panel";
import { IssueList } from "@/components/issue-list";
import { LocationMiniMap } from "@/components/land-map";
import { CountUp } from "@/components/motion";
import { NumberInput } from "@/components/number-input";
import { PlotLegend, PlotMap, plotColor } from "@/components/plot-map";
import { AllocationDetails } from "@/components/allocation-details";
import { Badge, Button, ButtonLink, Card, ChipToggle, cn, Field, Modal, Select, Switch } from "@/components/ui";
import { candidatesFor, inputFingerprint, runAllocation } from "@/lib/engine/allocate";
import { buildExplanationFacts } from "@/lib/engine/explain";
import { groupOpenIssues } from "@/lib/issues";
import { ACTIVITY_LABELS, ALL_ACTIVITIES, formatCurrency, IRRIGATION_LABELS, SEASON_LABELS, WATER_LABELS } from "@/lib/labels";
import { DURATION, EASE } from "@/lib/motion";
import { SEED_GROWERS, SEED_PROPERTIES } from "@/lib/seed";
import { useDemoStore } from "@/lib/store";
import { useMediaQuery } from "@/lib/use-media-query";
import type { AllocationResult, Grower, IrrigationStatus, Property, Season, WaterStatus } from "@/lib/types";

interface Scenario {
  id: string;
  label: string;
  icon: React.ReactNode;
  apply: (p: Property, growers: Grower[]) => { property?: Property; grower?: Grower };
}

const SCENARIOS: Scenario[] = [
  {
    id: "land-1",
    label: "Reduce cultivable land to 1.0 ac",
    icon: <Ruler className="h-3.5 w-3.5" />,
    apply: (p) => ({ property: { ...p, cultivableAcres: 1 } }),
  },
  {
    id: "water-none",
    label: "Water becomes unavailable",
    icon: <Droplets className="h-3.5 w-3.5" />,
    apply: (p) => ({ property: { ...p, water: "none" } }),
  },
  {
    id: "irrigation",
    label: "Irrigation capacity verified",
    icon: <Droplets className="h-3.5 w-3.5" />,
    apply: (p) => ({ property: { ...p, irrigation: "verified" } }),
  },
  {
    id: "budget-b",
    label: "Cut Grower B's budget to $15/mo",
    icon: <Calculator className="h-3.5 w-3.5" />,
    apply: (_p, g) => {
      const b = g.find((x) => x.id === "grower-b");
      return b ? { grower: { ...b, budgetMonthly: 15 } } : {};
    },
  },
  {
    id: "area-a",
    label: "Grower A needs 0.75 ac ($60/mo)",
    icon: <Users className="h-3.5 w-3.5" />,
    apply: (_p, g) => {
      const a = g.find((x) => x.id === "grower-a");
      return a ? { grower: { ...a, minAcres: 0.5, desiredAcres: 0.75, budgetMonthly: 60 } } : {};
    },
  },
  {
    id: "no-herbs",
    label: "Owner prohibits culinary herbs",
    icon: <CircleAlert className="h-3.5 w-3.5" />,
    apply: (p) => ({ property: { ...p, allowedActivities: p.allowedActivities.filter((a) => a !== "culinary-herbs") } }),
  },
];

export default function OptimizerPage() {
  const { state, activeProperty: property, saveProperty, saveGrower, saveResult, setActiveProperty } = useDemoStore();
  const candidates = useMemo(() => candidatesFor(property, state.growers), [property, state.growers]);
  const currentFp = useMemo(() => inputFingerprint(property, candidates), [property, candidates]);
  const result = state.results[property.id] ?? null;
  const stale = !!result && result.inputFingerprint !== currentFp;
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  const [previous, setPrevious] = useState<AllocationResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastScenario, setLastScenario] = useState<string | null>(null);
  const [tab, setTab] = useState<"applicants" | "why" | "confirm">("applicants");

  const facts = useMemo(
    () => (result && result.valid ? buildExplanationFacts(property, state.growers, result) : null),
    [property, state.growers, result],
  );
  const selectedPlot = result?.valid && selectedId ? result.plots.find((p) => p.growerId === selectedId) : undefined;
  const issueGroups = useMemo(
    () => (result?.valid ? groupOpenIssues(result, state.growers, property.soilTested) : []),
    [result, state.growers, property.soilTested],
  );

  function run() {
    const t0 = performance.now();
    const r = runAllocation(property, candidates);
    setElapsedMs(performance.now() - t0);
    setPrevious(result && result.inputFingerprint !== r.inputFingerprint ? result : null);
    saveResult(r);
    if (selectedId && !r.plots.some((p) => p.growerId === selectedId)) setSelectedId(null);
  }

  function applyScenario(s: Scenario) {
    const change = s.apply(property, state.growers);
    if (change.property) saveProperty(change.property);
    if (change.grower) saveGrower(change.grower);
    setLastScenario(s.id);
  }

  function restoreDefaults() {
    const seedProp = SEED_PROPERTIES.find((p) => p.id === property.id);
    if (seedProp) saveProperty({ ...structuredClone(seedProp), coordinates: property.coordinates });
    // Keep applications made through accepted requests; only reset the profile fields.
    for (const g of SEED_GROWERS) {
      const current = state.growers.find((x) => x.id === g.id);
      saveGrower({ ...structuredClone(g), interestedPropertyIds: current?.interestedPropertyIds ?? g.interestedPropertyIds });
    }
    setLastScenario(null);
  }

  const growerById = new Map(state.growers.map((g) => [g.id, g]));
  const sortedEvals = result?.valid
    ? [...result.evaluations].sort((a, b) => {
        const order = { placed: 0, "not-placed": 1, deferred: 2, rejected: 3 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return (a.plotId ?? a.growerId).localeCompare(b.plotId ?? b.growerId);
      })
    : [];

  const controls = (
    <>
      <LandConstraints property={property} onChange={saveProperty} />
      <GrowerQuickEdit candidates={candidates} onChange={saveGrower} />
    </>
  );

  return (
    <div>
      <PageHeader
        title="One property. Several compatible growers."
        description="Change anything, recalculate, and watch the plan adapt."
        actions={
          <>
            <Select aria-label="Property" value={property.id} onChange={(e) => setActiveProperty(e.target.value)} className="w-56">
              {state.properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Button size="lg" onClick={run} className={cn(stale && "ring-4 ring-gold/40")} data-testid="run-optimizer">
              {result ? <RefreshCw className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              {result ? "Recalculate Allocation" : "Run Optimization"}
            </Button>
          </>
        }
      />

      <Card className="mb-5 p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1.5 px-1 text-[12.5px] font-medium text-forest">
            <Wand2 className="h-3.5 w-3.5 text-gold-deep" /> What if…
          </span>
          {SCENARIOS.map((s) => (
            <ChipToggle key={s.id} checked={lastScenario === s.id} onChange={() => applyScenario(s)}>
              <span className={lastScenario === s.id ? "text-paper" : "text-forest"}>{s.icon}</span>
              {s.label}
            </ChipToggle>
          ))}
          <button
            type="button"
            onClick={restoreDefaults}
            className="state-layer inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-muted hover:text-forest"
          >
            <Undo2 className="h-3.5 w-3.5" /> Restore original inputs
          </button>
          <div className="ml-auto flex items-center gap-2">
            {isDesktop ? (
              <Button variant="ghost" size="sm" onClick={() => setControlsOpen((o) => !o)} aria-expanded={controlsOpen}>
                {controlsOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                {controlsOpen ? "Hide constraints" : "Adjust constraints"}
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setSheetOpen(true)}>
                <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust constraints
              </Button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {stale && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: DURATION.medium, ease: EASE.standard }}
              className="overflow-hidden px-1 text-[12.5px] text-warn"
            >
              <span className="mt-2 block">Inputs changed. Press Recalculate Allocation to update the plan.</span>
            </motion.p>
          )}
        </AnimatePresence>
      </Card>

      <div className={cn("grid gap-6", isDesktop && controlsOpen && "grid-cols-[minmax(0,1fr)_360px]")}>
        <section className="min-w-0 space-y-6">
          {result && !result.valid ? (
            <Card className="border-danger/30 p-6">
              <h3 className="flex items-center gap-2 font-medium text-danger">
                <CircleAlert className="h-4 w-4" /> The property inputs are inconsistent
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink/80">
                {result.validationErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">Fix the land constraints and recalculate. No allocation is produced from invalid inputs.</p>
            </Card>
          ) : null}

          {result?.valid && (
            <div className="grid grid-cols-3 gap-3" data-testid="result-stats">
              <MiniStat label="Growers placed" value={<><CountUp value={result.plots.length} /> / {result.stats.candidatesEvaluated}</>} />
              <MiniStat
                label="Acres allocated"
                value={<CountUp value={result.totals.allocatedAcres} format={(v) => v.toFixed(2)} />}
                sub={`of ${result.totals.cultivableAcres.toFixed(2)} cultivable`}
              />
              <MiniStat
                label="Needs attention"
                value={<CountUp value={result.stats.deferred + result.stats.rejected} />}
                sub={`${result.stats.deferred} deferred · ${result.stats.rejected} not compatible`}
              />
            </div>
          )}

          <AnimatePresence>{previous && result?.valid && !stale && <RunDiff key={result.inputFingerprint} previous={previous} current={result} growers={state.growers} />}</AnimatePresence>

          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <LocationMiniMap coordinates={property.coordinates} label={property.location} className="hidden h-14 w-20 shrink-0 sm:block" />
                <div>
                  <h2 className="font-serif text-2xl text-forest">{property.name}</h2>
                  <p className="text-[13px] text-muted">
                    {property.location} · {property.totalAcres.toFixed(2)} ac total · {property.cultivableAcres.toFixed(2)} ac cultivable ·{" "}
                    {property.reservedAcres.toFixed(2)} ac shared
                  </p>
                </div>
              </div>
              {result?.valid && (
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-muted">
                    {result.stats.combinationsExplored} combinations searched
                    {elapsedMs !== null ? ` · ${elapsedMs < 1 ? "<1" : elapsedMs.toFixed(0)} ms` : ""}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => setDetailsOpen(true)}>
                    <ListChecks className="h-3.5 w-3.5" /> View Allocation Details
                  </Button>
                </div>
              )}
            </div>
            <div className={cn("grid gap-5", result?.valid && result.plots.length > 0 && "lg:grid-cols-[minmax(0,1fr)_280px]")}>
              <PlotMap
                key={property.id}
                property={property}
                growers={state.growers}
                result={result}
                stale={stale}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
              {result?.valid && result.plots.length > 0 && (
                <SelectedPlotPanel result={result} growerId={selectedId} growers={state.growers} onSelect={setSelectedId} selectedPlot={selectedPlot} />
              )}
            </div>
            <div className="mt-4">
              {result?.valid ? (
                <PlotLegend result={result} growers={state.growers} property={property} />
              ) : (
                !result && (
                  <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-line-strong bg-cream/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted">
                      {candidates.length} applicant{candidates.length === 1 ? "" : "s"} are interested in this property. Run the optimizer to screen them and propose plots.
                    </p>
                    <Button onClick={run}>
                      <Zap className="h-4 w-4" /> Run Optimization
                    </Button>
                  </div>
                )
              )}
            </div>
          </Card>

          {result?.valid && result.plots.length === 0 && (
            <Card className="border-warn/30 bg-warn-soft/40 p-5">
              <h3 className="flex items-center gap-2 font-medium text-warn">
                <CircleAlert className="h-4 w-4" /> No suitable matches under the current constraints
              </h3>
              <p className="mt-1 text-sm text-ink/80">
                Every applicant fails at least one hard constraint or needs verification first. See the reasons below, adjust land or budgets, or verify infrastructure.
              </p>
            </Card>
          )}

          {result?.valid && facts && (
            <div>
              <div role="tablist" aria-label="Plan details" className="mb-4 inline-flex rounded-full border border-line bg-paper p-1 shadow-soft">
                {(
                  [
                    ["applicants", `Applicants · ${sortedEvals.length}`],
                    ["why", "Why this plan"],
                    ["confirm", `Before signing · ${issueGroups.length}`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={cn("relative rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap transition-colors", tab === id ? "text-paper" : "text-muted hover:text-forest")}
                  >
                    {tab === id && <motion.span layoutId="optimizer-tab" className="absolute inset-0 rounded-full bg-forest" transition={{ duration: DURATION.medium, ease: EASE.emphasizedDecelerate }} />}
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  role="tabpanel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: DURATION.short } }}
                  transition={{ duration: DURATION.medium, ease: EASE.emphasizedDecelerate }}
                >
                  {tab === "applicants" && (
                    <div className="space-y-3">
                      {sortedEvals.map((e) => {
                        const g = growerById.get(e.growerId);
                        if (!g) return null;
                        const plotIndex = result.plots.findIndex((p) => p.growerId === e.growerId);
                        return <CandidateCard key={e.growerId} grower={g} evaluation={e} plotIndex={plotIndex} />;
                      })}
                      <Link href="/growers" className="inline-block text-[13px] text-forest hover:underline">
                        Edit grower profiles
                      </Link>
                    </div>
                  )}
                  {tab === "why" && <ExplanationPanel facts={facts} fingerprint={result.inputFingerprint} />}
                  {tab === "confirm" && (
                    <Card className="p-5">
                      <h3 className="flex items-center gap-2 font-medium text-forest">
                        <Gauge className="h-4 w-4" /> Confirm before anyone signs
                      </h3>
                      <IssueList groups={issueGroups} className="mt-3" />
                      {result.plots.length > 0 && (
                        <ButtonLink href="/agreements" size="sm" className="mt-4">
                          <FileSignature className="h-3.5 w-3.5" /> Review agreement drafts
                        </ButtonLink>
                      )}
                    </Card>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </section>

        <AnimatePresence initial={false}>
          {isDesktop && controlsOpen && (
            <motion.aside
              key="controls"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24, transition: { duration: DURATION.short } }}
              transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
              className="space-y-4 self-start xl:sticky xl:top-[120px] xl:max-h-[calc(100svh-140px)] xl:overflow-y-auto xl:pb-2"
              aria-label="Constraints"
            >
              {controls}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {!isDesktop && (
        <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="Adjust constraints" subtitle={`Edits apply to ${property.name}. Recalculate to update the plan.`}>
          <div className="space-y-4">{controls}</div>
          <div className="sticky bottom-0 mt-4 bg-paper pt-2">
            <Button
              className="w-full"
              onClick={() => {
                run();
                setSheetOpen(false);
              }}
            >
              <RefreshCw className="h-4 w-4" /> Recalculate and close
            </Button>
          </div>
        </Modal>
      )}

      {result?.valid && (
        <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Allocation details" subtitle={`${property.name} · input fingerprint ${result.inputFingerprint}`} wide>
          <AllocationDetails result={result} growers={state.growers} property={property} />
        </Modal>
      )}
    </div>
  );
}

function SelectedPlotPanel({
  result,
  growerId,
  selectedPlot,
  growers,
  onSelect,
}: {
  result: AllocationResult;
  growerId: string | null;
  selectedPlot?: AllocationResult["plots"][number];
  growers: Grower[];
  onSelect: (id: string | null) => void;
}) {
  const byId = new Map(growers.map((g) => [g.id, g]));
  const g = growerId ? byId.get(growerId) : undefined;
  const evaluation = growerId ? result.evaluations.find((e) => e.growerId === growerId) : undefined;
  const open = evaluation?.checks.filter((c) => c.status !== "pass") ?? [];
  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-line bg-cream/50" data-testid="plot-panel">
      <AnimatePresence mode="wait" initial={false}>
        {selectedPlot && g ? (
          <motion.div
            key={selectedPlot.growerId}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8, transition: { duration: DURATION.short } }}
            transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
            className="p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl font-serif text-lg font-semibold text-paper"
                  style={{ background: plotColor(result, selectedPlot.growerId) }}
                >
                  {selectedPlot.plotId}
                </span>
                <div>
                  <p className="text-[12px] text-muted">Plot {selectedPlot.plotId} · {g.label}</p>
                  <p className="font-serif text-lg leading-tight text-forest">{g.name}</p>
                </div>
              </div>
              <button type="button" onClick={() => onSelect(null)} className="state-layer rounded-full p-1.5 text-muted" aria-label="Clear plot selection">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[12.5px] text-muted">{g.cropType}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
              <div className="rounded-xl bg-paper px-3 py-2">
                <dt className="text-muted">Area</dt>
                <dd className="font-serif text-lg text-forest">{selectedPlot.acres.toFixed(2)} ac</dd>
              </div>
              <div className="rounded-xl bg-paper px-3 py-2">
                <dt className="text-muted">Rent</dt>
                <dd className="font-serif text-lg text-forest">{formatCurrency(selectedPlot.monthlyRent)}/mo</dd>
              </div>
            </dl>
            <div className="mt-3">
              <div className="flex justify-between text-[11.5px] text-muted">
                <span>Of requested {g.desiredAcres.toFixed(2)} ac</span>
                <span>{Math.round(selectedPlot.fulfillment * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                <motion.div
                  className="h-full rounded-full bg-forest"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, selectedPlot.fulfillment * 100)}%` }}
                  transition={{ duration: DURATION.extraLong, ease: EASE.emphasizedDecelerate }}
                />
              </div>
            </div>
            {open.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {open.map((c) => (
                  <li key={c.id} className="flex gap-2 text-[12px] leading-snug text-ink/85">
                    <CheckIcon status={c.status} className="mt-px" />
                    <span>
                      <span className="font-medium">{c.label}.</span> {c.detail}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <ButtonLink href="/agreements" size="sm" variant="secondary" className="mt-4 w-full">
              <FileSignature className="h-3.5 w-3.5" /> Agreement draft
            </ButtonLink>
          </motion.div>
        ) : (
          <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
            <p className="flex items-center gap-2 text-[13px] font-medium text-forest">
              <MousePointerClick className="h-4 w-4 text-gold-deep" /> Select a plot
            </p>
            <p className="mt-1 text-[12px] text-muted">Click a plot on the plan, or pick one here, to see its grower, rent and anything to confirm.</p>
            <ul className="mt-3 space-y-1.5">
              {result.plots.map((p) => (
                <li key={p.growerId}>
                  <button
                    type="button"
                    onClick={() => onSelect(p.growerId)}
                    className="state-layer flex w-full items-center gap-2.5 rounded-xl bg-paper px-3 py-2 text-left text-[12.5px]"
                  >
                    <span className="h-3 w-3 rounded" style={{ background: plotColor(result, p.growerId) }} />
                    <span className="flex-1 truncate">
                      {p.plotId} · {byId.get(p.growerId)?.name}
                    </span>
                    <span className="font-medium text-forest">{p.acres.toFixed(2)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-4 py-3 shadow-soft">
      <p className="text-[12px] text-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl leading-none text-forest">{value}</p>
      {sub && <p className="mt-1 text-[11.5px] text-muted">{sub}</p>}
    </div>
  );
}

function RunDiff({ previous, current, growers }: { previous: AllocationResult; current: AllocationResult; growers: Grower[] }) {
  const byId = new Map(growers.map((g) => [g.id, g]));
  const prevPlots = new Map(previous.plots.map((p) => [p.growerId, p]));
  const curPlots = new Map(current.plots.map((p) => [p.growerId, p]));
  const lines: { tone: "sage" | "danger" | "gold"; text: string }[] = [];
  for (const [id, p] of curPlots) {
    const before = prevPlots.get(id);
    const label = byId.get(id)?.label ?? id;
    if (!before) lines.push({ tone: "sage", text: `${label} added (${p.acres.toFixed(2)} ac)` });
    else if (before.acres !== p.acres) lines.push({ tone: "gold", text: `${label}: ${before.acres.toFixed(2)} → ${p.acres.toFixed(2)} ac` });
  }
  for (const [id] of prevPlots) {
    if (!curPlots.has(id)) {
      const ev = current.evaluations.find((e) => e.growerId === id);
      const status = ev?.status === "rejected" ? "now not compatible" : ev?.status === "deferred" ? "now deferred" : "no longer placed";
      lines.push({ tone: "danger", text: `${byId.get(id)?.label ?? id} ${status}` });
    }
  }
  const acreDelta = current.totals.allocatedAcres - previous.totals.allocatedAcres;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
      className="overflow-hidden rounded-2xl border border-gold/40 bg-gold-soft/50"
      data-testid="run-diff"
    >
      <div className="p-4">
        <p className="flex items-center gap-2 text-[13px] font-medium text-gold-deep">
          <RefreshCw className="h-3.5 w-3.5" /> Allocation recalculated: what changed since the previous run
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {lines.length === 0 && <Badge tone="neutral">Same placements; explanations and checks updated</Badge>}
          {lines.map((l, i) => (
            <motion.span
              key={l.text}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: DURATION.medium, delay: 0.15 + i * 0.05, ease: EASE.emphasizedDecelerate }}
            >
              <Badge tone={l.tone}>{l.text}</Badge>
            </motion.span>
          ))}
          <Badge tone="neutral">
            Allocated area {acreDelta >= 0 ? "+" : ""}
            {acreDelta.toFixed(2)} ac
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

function LandConstraints({ property, onChange }: { property: Property; onChange: (p: Property) => void }) {
  const set = <K extends keyof Property>(k: K, v: Property[K]) => onChange({ ...property, [k]: v });
  const maxCultivable = Math.max(0, property.totalAcres - property.reservedAcres);
  return (
    <Card className="p-5">
      <h3 className="font-medium text-forest">Land constraints</h3>
      <p className="mt-1 text-[12.5px] text-muted">Edits apply to {property.name}.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Cultivable (ac)" hint={`max ${maxCultivable.toFixed(2)}`}>
          {(id) => <NumberInput id={id} value={property.cultivableAcres} min={0} max={50} onCommit={(v) => set("cultivableAcres", v)} />}
        </Field>
        <Field label="Shared / reserved (ac)">
          {(id) => <NumberInput id={id} value={property.reservedAcres} min={0} max={50} onCommit={(v) => set("reservedAcres", v)} />}
        </Field>
        <Field label="Min plot (ac)">
          {(id) => <NumberInput id={id} value={property.minPlotAcres} min={0.05} max={10} onCommit={(v) => set("minPlotAcres", v)} />}
        </Field>
        <Field label="Max plot (ac)">
          {(id) => <NumberInput id={id} value={property.maxPlotAcres} min={0.05} max={10} onCommit={(v) => set("maxPlotAcres", v)} />}
        </Field>
        <Field label="Max growers">
          {(id) => <NumberInput id={id} value={property.maxGrowers} min={1} max={12} step={1} onCommit={(v) => set("maxGrowers", Math.round(v))} />}
        </Field>
        <Field label="Rent ($/ac/mo)">
          {(id) => <NumberInput id={id} value={property.rentPerAcreMonthly} min={0} max={10000} step={5} onCommit={(v) => set("rentPerAcreMonthly", v)} />}
        </Field>
      </div>
      <div className="mt-3 grid gap-3">
        <Field label="Water">
          {(id) => (
            <Select id={id} value={property.water} onChange={(e) => set("water", e.target.value as WaterStatus)}>
              {(Object.keys(WATER_LABELS) as WaterStatus[]).map((w) => (
                <option key={w} value={w}>
                  {WATER_LABELS[w]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Irrigation capacity">
          {(id) => (
            <Select id={id} value={property.irrigation} onChange={(e) => set("irrigation", e.target.value as IrrigationStatus)}>
              {(Object.keys(IRRIGATION_LABELS) as IrrigationStatus[]).map((w) => (
                <option key={w} value={w}>
                  {IRRIGATION_LABELS[w]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Seasonal availability">
          {(id) => (
            <Select id={id} value={property.seasonalAvailability} onChange={(e) => set("seasonalAvailability", e.target.value as Season)}>
              {(Object.keys(SEASON_LABELS) as Season[]).map((s) => (
                <option key={s} value={s}>
                  {SEASON_LABELS[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5">
          <span className="text-[13px] font-medium">Vehicle access</span>
          <Switch checked={property.vehicleAccess} onChange={(v) => set("vehicleAccess", v)} label="Vehicle access" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[13px] font-medium">Permitted activities</p>
        <p className="mb-2 text-[11.5px] text-muted">Toggle off to prohibit.</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ACTIVITIES.map((a) => (
            <ChipToggle
              key={a}
              checked={property.allowedActivities.includes(a)}
              onChange={(on) =>
                set("allowedActivities", on ? [...property.allowedActivities, a] : property.allowedActivities.filter((x) => x !== a))
              }
            >
              {ACTIVITY_LABELS[a]}
            </ChipToggle>
          ))}
        </div>
      </div>
    </Card>
  );
}

function GrowerQuickEdit({ candidates, onChange }: { candidates: Grower[]; onChange: (g: Grower) => void }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-forest">Applicant requirements</h3>
        <Link href="/growers" className="text-[12.5px] text-forest hover:underline">
          Full profiles
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_72px_72px_72px] items-center gap-x-2 gap-y-2 text-[12px]">
        <span className="text-muted">Grower</span>
        <span className="text-muted">Min ac</span>
        <span className="text-muted">Want ac</span>
        <span className="text-muted">$/mo</span>
        {candidates.map((g) => (
          <GrowerRow key={g.id} g={g} onChange={onChange} />
        ))}
      </div>
      {candidates.length === 0 && <p className="mt-2 text-[12.5px] text-muted">No applicants for this property yet.</p>}
      <p className="mt-3 text-[11.5px] text-muted">Budgets are compared against {"the owner's"} rent per acre. Values shown in CAD.</p>
    </Card>
  );
}

function GrowerRow({ g, onChange }: { g: Grower; onChange: (g: Grower) => void }) {
  return (
    <>
      <span className="truncate font-medium text-ink" title={`${g.name} · ${g.cropType} · ${formatCurrency(g.budgetMonthly)}`}>
        {g.label}
        <span className="block truncate text-[11px] font-normal text-muted">{g.cropType}</span>
      </span>
      <NumberInput aria-label={`${g.label} minimum acres`} className="h-8 px-2 text-[12.5px]" value={g.minAcres} min={0.05} max={10} onCommit={(v) => onChange({ ...g, minAcres: v })} />
      <NumberInput aria-label={`${g.label} desired acres`} className="h-8 px-2 text-[12.5px]" value={g.desiredAcres} min={0.05} max={10} onCommit={(v) => onChange({ ...g, desiredAcres: v })} />
      <NumberInput aria-label={`${g.label} monthly budget`} className="h-8 px-2 text-[12.5px]" value={g.budgetMonthly} min={0} max={100000} step={5} onCommit={(v) => onChange({ ...g, budgetMonthly: v })} />
    </>
  );
}
