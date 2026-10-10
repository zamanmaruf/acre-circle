"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calculator,
  CircleAlert,
  Droplets,
  FileSignature,
  Gauge,
  ListChecks,
  RefreshCw,
  Ruler,
  Undo2,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { CandidateCard } from "@/components/candidate-card";
import { ExplanationPanel } from "@/components/explanation-panel";
import { NumberInput } from "@/components/number-input";
import { PlotLegend, PlotMap } from "@/components/plot-map";
import { AllocationDetails } from "@/components/allocation-details";
import { Badge, Button, ButtonLink, Card, ChipToggle, cn, Field, Modal, Select, Switch, SyntheticBadge } from "@/components/ui";
import { candidatesFor, inputFingerprint, runAllocation } from "@/lib/engine/allocate";
import { buildExplanationFacts } from "@/lib/engine/explain";
import { ACTIVITY_LABELS, ALL_ACTIVITIES, formatCurrency, IRRIGATION_LABELS, SEASON_LABELS, WATER_LABELS } from "@/lib/labels";
import { SEED_GROWERS, SEED_PROPERTIES } from "@/lib/seed";
import { useDemoStore } from "@/lib/store";
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

  const [previous, setPrevious] = useState<AllocationResult | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const facts = useMemo(
    () => (result && result.valid ? buildExplanationFacts(property, state.growers, result) : null),
    [property, state.growers, result],
  );

  function run() {
    const t0 = performance.now();
    const r = runAllocation(property, candidates);
    setElapsedMs(performance.now() - t0);
    setPrevious(result && result.inputFingerprint !== r.inputFingerprint ? result : null);
    saveResult(r);
    setRunKey((k) => k + 1);
  }

  function applyScenario(s: Scenario) {
    const change = s.apply(property, state.growers);
    if (change.property) saveProperty(change.property);
    if (change.grower) saveGrower(change.grower);
  }

  function restoreDefaults() {
    const seedProp = SEED_PROPERTIES.find((p) => p.id === property.id);
    if (seedProp) saveProperty(structuredClone(seedProp));
    for (const g of SEED_GROWERS) saveGrower(structuredClone(g));
  }

  const growerById = new Map(state.growers.map((g) => [g.id, g]));
  const sortedEvals = result?.valid
    ? [...result.evaluations].sort((a, b) => {
        const order = { placed: 0, "not-placed": 1, deferred: 2, rejected: 3 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return (a.plotId ?? a.growerId).localeCompare(b.plotId ?? b.growerId);
      })
    : [];

  return (
    <div>
      <PageHeader
        eyebrow="Cooperative plot optimizer"
        title="One property. Several compatible growers."
        description="A deterministic constraint engine screens every applicant, then searches every combination of eligible growers to find a feasible shared-plot plan. Change any constraint and recalculate to see the plan respond."
        actions={
          <>
            <Select
              aria-label="Property"
              value={property.id}
              onChange={(e) => setActiveProperty(e.target.value)}
              className="w-56"
            >
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

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="order-2 space-y-4 xl:sticky xl:top-[120px] xl:order-1 xl:self-start">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-gold-deep" />
              <h3 className="font-medium text-forest">Try a what-if</h3>
            </div>
            <p className="mt-1 text-[12.5px] text-muted">One click changes an input. Then press Recalculate Allocation.</p>
            <div className="mt-3 flex flex-col gap-1.5">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => applyScenario(s)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-left text-[13px] text-ink transition-colors hover:border-forest/40 hover:bg-sage-soft/50"
                >
                  <span className="text-forest">{s.icon}</span>
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                onClick={restoreDefaults}
                className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-muted hover:bg-cream hover:text-forest"
              >
                <Undo2 className="h-3.5 w-3.5" /> Restore original inputs
              </button>
            </div>
          </Card>

          <LandConstraints property={property} onChange={saveProperty} />
          <GrowerQuickEdit candidates={candidates} onChange={saveGrower} />
        </aside>

        <section className="order-1 min-w-0 space-y-6 xl:order-2">
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
              <p className="mt-3 text-sm text-muted">Fix the land constraints on the left and recalculate. No allocation is produced from invalid inputs.</p>
            </Card>
          ) : null}

          {result?.valid && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5" data-testid="result-stats">
              <MiniStat label="Growers placed" value={`${result.plots.length} / ${result.stats.candidatesEvaluated}`} />
              <MiniStat label="Acres allocated" value={`${result.totals.allocatedAcres.toFixed(2)}`} sub={`of ${result.totals.cultivableAcres.toFixed(2)} cultivable`} />
              <MiniStat label="Deferred" value={String(result.stats.deferred)} sub="needs verification" />
              <MiniStat label="Not compatible" value={String(result.stats.rejected)} sub="hard constraint failed" />
              <MiniStat
                label="Combinations searched"
                value={String(result.stats.combinationsExplored)}
                sub={`${result.stats.feasibleCombinations} feasible${elapsedMs !== null ? ` · ${elapsedMs < 1 ? "<1" : elapsedMs.toFixed(0)} ms` : ""}`}
              />
            </div>
          )}

          {previous && result?.valid && !stale && <RunDiff previous={previous} current={result} growers={state.growers} />}

          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-2xl text-forest">{property.name}</h2>
                  <SyntheticBadge />
                </div>
                <p className="text-[13px] text-muted">
                  {property.location} · {property.totalAcres.toFixed(2)} ac total · {property.cultivableAcres.toFixed(2)} ac cultivable ·{" "}
                  {property.reservedAcres.toFixed(2)} ac shared
                </p>
              </div>
              <div className="flex items-center gap-2">
                {result?.valid && (
                  <Button variant="secondary" size="sm" onClick={() => setDetailsOpen(true)}>
                    <ListChecks className="h-3.5 w-3.5" /> View Allocation Details
                  </Button>
                )}
              </div>
            </div>
            <PlotMap key={`${property.id}-${runKey > 0 ? "run" : "init"}`} property={property} growers={state.growers} result={result} stale={stale} />
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
            <div className="grid gap-6 2xl:grid-cols-[1fr_1fr]">
              <div className="space-y-6">
                <ExplanationPanel facts={facts} fingerprint={result.inputFingerprint} />
                <Card className="p-5">
                  <h3 className="flex items-center gap-2 font-medium text-forest">
                    <Gauge className="h-4 w-4" /> Before anyone signs anything
                  </h3>
                  <ul className="mt-3 space-y-2 text-[13px]">
                    {result.openIssues.map((i) => (
                      <li key={i} className="flex gap-2 text-ink/85">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                        {i}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.plots.length > 0 && (
                      <ButtonLink href="/agreements" size="sm">
                        <FileSignature className="h-3.5 w-3.5" /> Review agreement drafts
                      </ButtonLink>
                    )}
                    <ButtonLink href="/dashboard" size="sm" variant="secondary">
                      Organization dashboard <ArrowRight className="h-3.5 w-3.5" />
                    </ButtonLink>
                  </div>
                </Card>
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium text-forest">Applicants ({sortedEvals.length})</h3>
                  <Link href="/growers" className="text-[13px] text-forest hover:underline">
                    Edit grower profiles
                  </Link>
                </div>
                <div className="space-y-3">
                  {sortedEvals.map((e) => {
                    const g = growerById.get(e.growerId);
                    if (!g) return null;
                    const plotIndex = result.plots.findIndex((p) => p.growerId === e.growerId);
                    return <CandidateCard key={e.growerId} grower={g} evaluation={e} plotIndex={plotIndex} />;
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {result?.valid && (
        <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Allocation details" subtitle={`${property.name} · input fingerprint ${result.inputFingerprint}`} wide>
          <AllocationDetails result={result} growers={state.growers} property={property} />
        </Modal>
      )}
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="animate-fade-up rounded-2xl border border-line bg-paper px-4 py-3 shadow-soft">
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
    <div className="animate-fade-up rounded-2xl border border-gold/40 bg-gold-soft/50 p-4" data-testid="run-diff">
      <p className="flex items-center gap-2 text-[13px] font-medium text-gold-deep">
        <RefreshCw className="h-3.5 w-3.5" /> Allocation recalculated: what changed since the previous run
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {lines.length === 0 && <Badge tone="neutral">Same placements; explanations and checks updated</Badge>}
        {lines.map((l) => (
          <Badge key={l.text} tone={l.tone}>
            {l.text}
          </Badge>
        ))}
        <Badge tone="neutral">
          Allocated area {acreDelta >= 0 ? "+" : ""}
          {acreDelta.toFixed(2)} ac
        </Badge>
      </div>
    </div>
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
