"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Car, Droplets, Pencil, Plus, Search, Sprout, Trash2, Wrench, CalendarDays, MapPin } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { CheckIcon } from "@/components/candidate-card";
import { NumberInput } from "@/components/number-input";
import { Badge, Button, ButtonLink, Card, ChipToggle, cn, EmptyState, Field, Input, Modal, Select, Switch, SyntheticBadge, Textarea } from "@/components/ui";
import { candidatesFor, runAllocation } from "@/lib/engine/allocate";
import {
  ACTIVITY_LABELS,
  ALL_ACTIVITIES,
  ALL_FACILITIES,
  EXPERIENCE_LABELS,
  FACILITY_LABELS,
  formatCurrency,
  PRACTICE_LABELS,
  REGIONS,
  SEASON_LABELS,
  WATER_NEED_LABELS,
} from "@/lib/labels";
import { fieldErrors, GrowerFormSchema } from "@/lib/schemas";
import { useDemoStore } from "@/lib/store";
import type { CandidateEvaluation, Experience, Grower, Practice, Region, Season, WaterNeed } from "@/lib/types";

type Filter = "all" | "eligible" | "deferred" | "rejected";

export default function GrowersPage() {
  const { state, activeProperty, saveGrower, removeGrower, setActiveProperty } = useDemoStore();
  const [editing, setEditing] = useState<Grower | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [justSaved, setJustSaved] = useState<string | null>(null);

  const liveCheck = useMemo(() => runAllocation(activeProperty, candidatesFor(activeProperty, state.growers)), [activeProperty, state.growers]);
  const evalById = new Map(liveCheck.evaluations.map((e) => [e.growerId, e]));
  const seedIds = new Set(["grower-a", "grower-b", "grower-c", "grower-d", "grower-e"]);

  const bucket = (g: Grower): Filter | "other" => {
    const e = evalById.get(g.id);
    if (!e) return "other";
    if (e.status === "placed" || e.status === "not-placed") return "eligible";
    return e.status;
  };

  const visible = state.growers.filter((g) => {
    const q = query.trim().toLowerCase();
    const matchesQ = !q || [g.name, g.label, g.cropType, g.region].some((s) => s.toLowerCase().includes(q));
    return matchesQ && (filter === "all" || bucket(g) === filter);
  });

  const counts = {
    all: state.growers.length,
    eligible: state.growers.filter((g) => bucket(g) === "eligible").length,
    deferred: state.growers.filter((g) => bucket(g) === "deferred").length,
    rejected: state.growers.filter((g) => bucket(g) === "rejected").length,
  };

  function nextLabel() {
    const used = new Set(state.growers.map((g) => g.label));
    for (let i = 0; i < 26; i++) {
      const l = `Grower ${String.fromCharCode(65 + i)}`;
      if (!used.has(l)) return l;
    }
    return `Grower ${state.growers.length + 1}`;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Growers · applicant marketplace"
        title="Aspiring growers looking for land"
        description="Each profile states what the grower needs: area, budget, water, access and season. Eligibility below is checked live against the selected property by the same engine the optimizer uses."
        actions={
          <>
            <Button onClick={() => setCreating(true)} data-testid="create-grower">
              <Plus className="h-4 w-4" /> Create Grower Profile
            </Button>
            <ButtonLink href="/optimizer" variant="secondary">
              Run optimizer <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </>
        }
      />

      <Card className="mb-6 flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-16 overflow-hidden rounded-xl">
            <Image src={activeProperty.image} alt="" fill sizes="64px" className="object-cover" />
          </div>
          <div>
            <p className="text-[12px] text-muted">Checking eligibility against</p>
            <Select aria-label="Property to check against" value={activeProperty.id} onChange={(e) => setActiveProperty(e.target.value)} className="h-8 w-60 text-[13px]">
              {state.properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input aria-label="Search growers" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, crop, region" className="h-9 w-60 pl-9" />
          </div>
          {(["all", "eligible", "deferred", "rejected"] as Filter[]).map((f) => (
            <ChipToggle key={f} checked={filter === f} onChange={() => setFilter(f)}>
              {f === "all" ? "All" : f === "eligible" ? "Eligible" : f === "deferred" ? "Needs verification" : "Not compatible"} · {counts[f]}
            </ChipToggle>
          ))}
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Sprout className="h-5 w-5" />}
          title="No growers match this view"
          body="Try clearing the search or filter, or create a new grower profile."
          action={
            <Button onClick={() => { setQuery(""); setFilter("all"); }} variant="secondary">
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((g) => (
            <GrowerCard
              key={g.id}
              grower={g}
              evaluation={evalById.get(g.id)}
              propertyName={activeProperty.name}
              highlight={justSaved === g.id}
              onEdit={() => setEditing(g)}
              onRemove={seedIds.has(g.id) ? undefined : () => removeGrower(g.id)}
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-[12px] text-muted">
        All grower profiles are fictional and created for this demonstration. They do not represent real people, businesses or platform users.
      </p>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing?.label ?? ""}`} subtitle="Changes update eligibility immediately. Recalculate in the optimizer to update the plot plan." wide>
        {editing && (
          <GrowerForm
            initial={editing}
            properties={state.properties.map((p) => ({ id: p.id, name: p.name }))}
            onCancel={() => setEditing(null)}
            onSave={(g) => {
              saveGrower(g);
              setJustSaved(g.id);
              setEditing(null);
            }}
          />
        )}
      </Modal>
      <Modal open={creating} onClose={() => setCreating(false)} title="Create grower profile" subtitle="Use fictional details for this demo. Avoid entering personal information." wide>
        {creating && (
          <GrowerForm
            initial={blankGrower(nextLabel(), activeProperty.id)}
            properties={state.properties.map((p) => ({ id: p.id, name: p.name }))}
            onCancel={() => setCreating(false)}
            onSave={(g) => {
              saveGrower({ ...g, id: `grower-${Date.now().toString(36)}` });
              setCreating(false);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function blankGrower(label: string, propertyId: string): Grower {
  return {
    id: "",
    label,
    name: "",
    kind: "individual",
    cropType: "",
    activities: ["mixed-vegetables"],
    region: "Annapolis Valley",
    maxTravelKm: 50,
    budgetMonthly: 30,
    minAcres: 0.25,
    desiredAcres: 0.25,
    waterNeed: "basic",
    needsVehicleAccess: false,
    season: "growing-season",
    experience: "beginner",
    equipmentNeeds: [],
    practice: "organic-practices",
    interestedPropertyIds: [propertyId],
    notes: "",
    synthetic: true,
  };
}

function eligibilityBadge(e?: CandidateEvaluation) {
  if (!e) return <Badge tone="neutral">Not applying here</Badge>;
  if (e.status === "placed" || e.status === "not-placed") return <Badge tone="sage">Eligible</Badge>;
  if (e.status === "deferred") return <Badge tone="warn">Needs verification</Badge>;
  return <Badge tone="danger">Not compatible</Badge>;
}

function GrowerCard({
  grower: g,
  evaluation,
  propertyName,
  highlight,
  onEdit,
  onRemove,
}: {
  grower: Grower;
  evaluation?: CandidateEvaluation;
  propertyName: string;
  highlight: boolean;
  onEdit: () => void;
  onRemove?: () => void;
}) {
  const unresolved = evaluation?.checks.filter((c) => c.status !== "pass") ?? [];
  return (
    <Card className={cn("flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift", highlight && "ring-2 ring-gold")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest font-serif text-lg font-semibold text-paper">
            {g.label.replace("Grower ", "")}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium text-gold-deep">{g.label}</p>
            <h3 className="truncate font-serif text-[19px] leading-tight text-forest">{g.name}</h3>
          </div>
        </div>
        {eligibilityBadge(evaluation)}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[13.5px] font-medium text-ink">
        <Sprout className="h-4 w-4 text-forest" /> {g.cropType}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-cream px-3 py-2">
          <p className="text-[11.5px] text-muted">Desired area</p>
          <p className="font-serif text-lg text-forest">{g.desiredAcres.toFixed(2)} ac</p>
          <p className="text-[11px] text-muted">min {g.minAcres.toFixed(2)} ac</p>
        </div>
        <div className="rounded-xl bg-cream px-3 py-2">
          <p className="text-[11.5px] text-muted">Budget</p>
          <p className="font-serif text-lg text-forest">{formatCurrency(g.budgetMonthly)}</p>
          <p className="text-[11px] text-muted">per month</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-[12.5px] text-ink/80">
        <li className="flex items-center gap-2">
          <Droplets className="h-3.5 w-3.5 text-muted" /> {WATER_NEED_LABELS[g.waterNeed]}
        </li>
        <li className="flex items-center gap-2">
          <Car className="h-3.5 w-3.5 text-muted" /> {g.needsVehicleAccess ? "Needs vehicle access" : "No vehicle access needed"}
        </li>
        <li className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-muted" /> {SEASON_LABELS[g.season]}
        </li>
        <li className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-muted" /> {g.region} · travels up to {g.maxTravelKm} km
        </li>
        {g.equipmentNeeds.length > 0 && (
          <li className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-muted" /> {g.equipmentNeeds.map((f) => FACILITY_LABELS[f]).join(", ")}
          </li>
        )}
      </ul>
      {evaluation && (
        <div className="mt-4 rounded-xl border border-line bg-white/60 p-3">
          <p className="text-[11.5px] font-medium text-muted">
            vs {propertyName}: {evaluation.checks.length - unresolved.length}/{evaluation.checks.length} checks pass
          </p>
          {unresolved.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {unresolved.map((c) => (
                <li key={c.id} className="flex gap-2 text-[12px] text-ink/80">
                  <CheckIcon status={c.status} className="mt-px h-4 w-4" />
                  <span>
                    <span className="font-medium">{c.label}:</span> {c.detail}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[12px] text-forest">No unresolved requirements.</p>
          )}
        </div>
      )}
      <div className="mt-auto flex items-center gap-2 pt-4">
        <Button variant="secondary" size="sm" onClick={onEdit} aria-label={`Edit ${g.label}`}>
          <Pencil className="h-3.5 w-3.5" /> Edit profile
        </Button>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove ${g.label}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        <SyntheticBadge className="ml-auto" />
      </div>
    </Card>
  );
}

function GrowerForm({
  initial,
  properties,
  onSave,
  onCancel,
}: {
  initial: Grower;
  properties: { id: string; name: string }[];
  onSave: (g: Grower) => void;
  onCancel: () => void;
}) {
  const [g, setG] = useState<Grower>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Grower>(k: K, v: Grower[K]) => setG((prev) => ({ ...prev, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = GrowerFormSchema.safeParse(g);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    onSave({ ...g, name: g.name.trim(), cropType: g.cropType.trim() });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Grower or group name" required error={errors.name}>
          {(id) => <Input id={id} value={g.name} onChange={(e) => set("name", e.target.value)} invalid={!!errors.name} />}
        </Field>
        <Field label="Crop type / project" required error={errors.cropType}>
          {(id) => <Input id={id} value={g.cropType} onChange={(e) => set("cropType", e.target.value)} placeholder="e.g. Specialty vegetables" invalid={!!errors.cropType} />}
        </Field>
        <Field label="Preferred location (region)">
          {(id) => (
            <Select id={id} value={g.region} onChange={(e) => set("region", e.target.value as Region)}>
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Maximum travel distance (km)" error={errors.maxTravelKm}>
          {(id) => <NumberInput id={id} value={g.maxTravelKm} min={0} max={1000} step={5} onCommit={(v) => set("maxTravelKm", v)} />}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Minimum workable (ac)" required error={errors.minAcres}>
          {(id) => <NumberInput id={id} value={g.minAcres} min={0.01} max={100} onCommit={(v) => set("minAcres", v)} />}
        </Field>
        <Field label="Desired area (ac)" required error={errors.desiredAcres}>
          {(id) => <NumberInput id={id} value={g.desiredAcres} min={0.01} max={100} onCommit={(v) => set("desiredAcres", v)} />}
        </Field>
        <Field label="Budget ($/month)" required error={errors.budgetMonthly}>
          {(id) => <NumberInput id={id} value={g.budgetMonthly} min={0} max={100000} step={5} onCommit={(v) => set("budgetMonthly", v)} />}
        </Field>
        <Field label="Water requirements">
          {(id) => (
            <Select id={id} value={g.waterNeed} onChange={(e) => set("waterNeed", e.target.value as WaterNeed)}>
              {(Object.keys(WATER_NEED_LABELS) as WaterNeed[]).map((w) => (
                <option key={w} value={w}>
                  {WATER_NEED_LABELS[w]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Desired growing season">
          {(id) => (
            <Select id={id} value={g.season} onChange={(e) => set("season", e.target.value as Season)}>
              {(Object.keys(SEASON_LABELS) as Season[]).map((s) => (
                <option key={s} value={s}>
                  {SEASON_LABELS[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Farming experience">
          {(id) => (
            <Select id={id} value={g.experience} onChange={(e) => set("experience", e.target.value as Experience)}>
              {(Object.keys(EXPERIENCE_LABELS) as Experience[]).map((x) => (
                <option key={x} value={x}>
                  {EXPERIENCE_LABELS[x]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Growing practice">
          {(id) => (
            <Select id={id} value={g.practice} onChange={(e) => set("practice", e.target.value as Practice)}>
              {(Object.keys(PRACTICE_LABELS) as Practice[]).map((x) => (
                <option key={x} value={x}>
                  {PRACTICE_LABELS[x]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="flex items-center justify-between self-end rounded-xl border border-line bg-white px-3.5 py-2.5 sm:col-span-2">
          <span className="text-[13px] font-medium">Requires vehicle access</span>
          <Switch checked={g.needsVehicleAccess} onChange={(v) => set("needsVehicleAccess", v)} label="Requires vehicle access" />
        </div>
      </div>
      <div>
        <p className="text-[13px] font-medium">Intended activities</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ALL_ACTIVITIES.map((a) => (
            <ChipToggle key={a} checked={g.activities.includes(a)} onChange={(on) => set("activities", on ? [...g.activities, a] : g.activities.filter((x) => x !== a))}>
              {ACTIVITY_LABELS[a]}
            </ChipToggle>
          ))}
        </div>
        {errors.activities && <p className="mt-1.5 text-xs text-danger">{errors.activities}</p>}
      </div>
      <div>
        <p className="text-[13px] font-medium">Shared-equipment needs</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ALL_FACILITIES.map((f) => (
            <ChipToggle key={f} checked={g.equipmentNeeds.includes(f)} onChange={(on) => set("equipmentNeeds", on ? [...g.equipmentNeeds, f] : g.equipmentNeeds.filter((x) => x !== f))}>
              {FACILITY_LABELS[f]}
            </ChipToggle>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[13px] font-medium">Applying to</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {properties.map((p) => (
            <ChipToggle
              key={p.id}
              checked={g.interestedPropertyIds.includes(p.id)}
              onChange={(on) => set("interestedPropertyIds", on ? [...g.interestedPropertyIds, p.id] : g.interestedPropertyIds.filter((x) => x !== p.id))}
            >
              {p.name}
            </ChipToggle>
          ))}
        </div>
      </div>
      <Field label="Notes">
        {(id) => <Textarea id={id} value={g.notes} onChange={(e) => set("notes", e.target.value)} />}
      </Field>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
        {Object.keys(errors).length > 0 && <p className="mr-auto text-[12.5px] text-danger">Please fix the highlighted fields.</p>}
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" data-testid="save-grower">
          Save profile
        </Button>
      </div>
      <p className="text-[11.5px] text-muted">
        Saved in this browser only. <Link href="/optimizer" className="underline">Recalculate the allocation</Link> to see the plot plan change.
      </p>
    </form>
  );
}
