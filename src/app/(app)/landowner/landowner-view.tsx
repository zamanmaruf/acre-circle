"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleHelp,
  Droplets,
  FlaskConical,
  MapPin,
  Pencil,
  Plus,
  Ruler,
  Save,
  ScrollText,
  Users,
  Warehouse,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { NumberInput } from "@/components/number-input";
import { Badge, Button, ButtonLink, Card, ChipToggle, cn, Field, Input, Select, Switch, Textarea } from "@/components/ui";
import { candidatesFor } from "@/lib/engine/allocate";
import { REGION_CENTROIDS } from "@/lib/engine/regions";
import {
  ACTIVITY_LABELS,
  ALL_ACTIVITIES,
  ALL_FACILITIES,
  FACILITY_LABELS,
  formatCurrency,
  IRRIGATION_LABELS,
  REGIONS,
  SEASON_LABELS,
  WATER_LABELS,
} from "@/lib/labels";
import { CoordinatesSchema, fieldErrors, PropertyFormSchema } from "@/lib/schemas";
import { LocationMiniMap, PinPickerMap } from "@/components/land-map";
import { isOpen } from "@/lib/requests";
import { useDemoStore } from "@/lib/store";
import type { IrrigationStatus, PlotRequest, Property, Region, Season, WaterStatus } from "@/lib/types";

function blankProperty(): Property {
  return {
    id: "",
    name: "",
    ownerName: "Demo landowner (synthetic)",
    location: "",
    region: "Annapolis Valley",
    coordinates: { ...REGION_CENTROIDS["Annapolis Valley"] },
    description: "",
    totalAcres: 1,
    cultivableAcres: 0.75,
    reservedAcres: 0.25,
    water: "unknown",
    irrigation: "none",
    vehicleAccess: true,
    soilInfo: "",
    soilTested: false,
    allowedActivities: ["mixed-vegetables", "culinary-herbs"],
    minPlotAcres: 0.25,
    maxPlotAcres: 0.5,
    maxGrowers: 3,
    rentPerAcreMonthly: 80,
    sharedFacilities: [],
    seasonalAvailability: "growing-season",
    restrictions: "",
    listingStatus: "draft",
    image: "/images/soil.jpg",
    synthetic: true,
  };
}

export function LandownerView() {
  const params = useSearchParams();
  const router = useRouter();
  const { state, activeProperty, saveProperty, setActiveProperty } = useDemoStore();
  const mode = params.get("mode");
  const propertyId = params.get("property");
  const property = (propertyId && state.properties.find((p) => p.id === propertyId)) || activeProperty;

  if (mode === "new" || mode === "edit") {
    const initial = mode === "edit" ? property : blankProperty();
    return (
      <PropertyForm
        key={`${mode}-${initial.id}`}
        initial={initial}
        isNew={mode === "new"}
        onCancel={() => router.push(`/landowner?property=${property.id}`)}
        onSave={(p) => {
          saveProperty(p);
          router.push(`/landowner?property=${p.id}&saved=1`);
        }}
      />
    );
  }

  return (
    <PropertyResults
      property={property}
      saved={params.get("saved") === "1"}
      applicants={candidatesFor(property, state.growers).length}
      requests={state.requests}
      onFindGrowers={() => {
        setActiveProperty(property.id);
        router.push("/optimizer");
      }}
    />
  );
}

function configurations(p: Property) {
  const c = p.cultivableAcres;
  const mk = (size: number) => {
    const s = Math.max(0.05, Math.round(size * 20) / 20);
    const count = Math.min(p.maxGrowers, Math.floor((c + 1e-9) / s));
    return { size: s, count, used: Math.round(count * s * 100) / 100 };
  };
  return [
    { name: "Fewer, larger plots", ...mk(p.maxPlotAcres) },
    { name: "Balanced mix", ...mk((p.minPlotAcres + p.maxPlotAcres) / 2) },
    { name: "More, smaller plots", ...mk(p.minPlotAcres) },
  ].filter((x, i, arr) => x.count > 0 && arr.findIndex((y) => y.size === x.size) === i);
}

function PropertyResults({
  property: p,
  saved,
  applicants,
  requests,
  onFindGrowers,
}: {
  property: Property;
  saved: boolean;
  applicants: number;
  requests: PlotRequest[];
  onFindGrowers: () => void;
}) {
  const facts: { icon: React.ReactNode; text: string; confirm?: boolean }[] = [
    { icon: <Ruler className="h-4 w-4" />, text: `${p.totalAcres.toFixed(2)} ac total, about ${p.cultivableAcres.toFixed(2)} ac cultivable`, confirm: true },
    {
      icon: <Droplets className="h-4 w-4" />,
      text: p.water === "verified" ? "Water source verified" : `Water: ${WATER_LABELS[p.water]}`,
      confirm: p.water !== "verified",
    },
    ...(p.irrigation === "unverified" ? [{ icon: <Droplets className="h-4 w-4" />, text: "Irrigation capacity", confirm: true }] : []),
    {
      icon: <FlaskConical className="h-4 w-4" />,
      text: p.soilTested ? `Soil: ${p.soilInfo || "lab tested"}` : `Soil: ${p.soilInfo || "no information"} (no lab test)`,
      confirm: !p.soilTested,
    },
    { icon: <Car className="h-4 w-4" />, text: p.vehicleAccess ? "Vehicle access" : "Walk-in access only" },
    {
      icon: <Warehouse className="h-4 w-4" />,
      text: p.sharedFacilities.length ? `Shared: ${p.sharedFacilities.map((f) => FACILITY_LABELS[f].toLowerCase()).join(", ")}` : "No shared facilities",
    },
    { icon: <CheckCircle2 className="h-4 w-4" />, text: `Permitted: ${p.allowedActivities.map((a) => ACTIVITY_LABELS[a].toLowerCase()).join(", ")}` },
    { icon: <ScrollText className="h-4 w-4" />, text: SEASON_LABELS[p.seasonalAvailability] },
    { icon: <CircleHelp className="h-4 w-4" />, text: "Ownership and right to lease", confirm: true },
  ];
  const toConfirm = facts.filter((f) => f.confirm).length;
  const steps = [
    { text: "Check the water source (flow and reliability)", done: p.water === "verified" },
    { text: "Get a basic soil test", done: p.soilTested },
    { text: "Confirm ownership, insurance and municipal rules", done: false },
    { text: "Find compatible growers", done: false },
    { text: "Meet shortlisted growers on site", done: false },
  ];
  const configs = configurations(p);
  const maxPlots = Math.min(p.maxGrowers, Math.floor((p.cultivableAcres + 1e-9) / p.minPlotAcres));
  const openRequests = requests.filter((r) => r.propertyId === p.id && isOpen(r)).length;

  return (
    <div>
      {openRequests > 0 && (
        <Link
          href="/inbox"
          data-testid="requests-banner"
          className="state-layer mb-5 flex animate-fade-up items-center gap-3 rounded-2xl border border-gold/50 bg-gold-soft/60 px-4 py-3 text-sm text-forest"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
          </span>
          <span className="flex-1">
            {openRequests} grower request{openRequests === 1 ? "" : "s"} waiting for your reply on {p.name}.
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            Review in inbox <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}
      {saved && (
        <div className="mb-5 flex animate-fade-up items-center gap-2 rounded-2xl border border-sage bg-sage-soft px-4 py-3 text-sm text-forest">
          <CheckCircle2 className="h-4 w-4" /> Listing saved to this demo session. It is now the active property for matching.
        </div>
      )}
      <PageHeader
        title={p.name}
        description={p.description || "No description provided."}
        actions={
          <>
            <ButtonLink href={`/landowner?mode=edit&property=${p.id}`} variant="secondary">
              <Pencil className="h-4 w-4" /> Edit listing
            </ButtonLink>
            <ButtonLink href="/landowner?mode=new" variant="ghost">
              <Plus className="h-4 w-4" /> List new property
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <div className="relative h-56 sm:h-72">
            <Image src={p.image} alt="" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-paper">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge tone={p.listingStatus === "ready" ? "sage" : "gold"}>
                  {p.listingStatus === "ready" ? "Ready for matching" : p.listingStatus === "in-review" ? "Listing in review" : "Draft"}
                </Badge>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-paper/85">
                <MapPin className="h-4 w-4" /> {p.location}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-line border-t border-line sm:grid-cols-4 sm:divide-x">
            {[
              ["Total area", `${p.totalAcres.toFixed(2)} ac`],
              ["Potential growing", `${p.cultivableAcres.toFixed(2)} ac`],
              ["Reserved / shared", `${p.reservedAcres.toFixed(2)} ac`],
              ["Owner's rate", `${formatCurrency(p.rentPerAcreMonthly)}/ac/mo`],
            ].map(([k, v]) => (
              <div key={k} className="px-5 py-4">
                <p className="text-[12px] text-muted">{k}</p>
                <p className="mt-1 font-serif text-[22px] text-forest">{v}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <LocationMiniMap coordinates={p.coordinates} label={p.location} className="mb-5 h-28" />
          <p className="text-[11.5px] font-semibold tracking-[0.16em] text-gold-deep uppercase">Land opportunity summary</p>
          <p className="mt-3 font-serif text-[22px] leading-snug text-forest">
            Up to {maxPlots} micro-plot{maxPlots === 1 ? "" : "s"} could fit within {p.cultivableAcres.toFixed(2)} cultivable acres, using the owner&apos;s{" "}
            {p.minPlotAcres.toFixed(2)}–{p.maxPlotAcres.toFixed(2)} ac plot limits.
          </p>
          <p className="mt-3 text-sm text-muted">
            {applicants} applicant{applicants === 1 ? "" : "s"} interested so far.
          </p>
          <div className="mt-auto pt-6">
            <Button size="lg" className="w-full" onClick={onFindGrowers} data-testid="find-growers">
              <Users className="h-4 w-4" /> Find Compatible Growers <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-6" data-testid="property-facts">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-medium text-forest">Property facts</h3>
            <p className="text-[12px] text-muted">Owner-reported · {toConfirm} to confirm before any agreement</p>
          </div>
          <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {facts.map((f) => (
              <li key={f.text} className="flex items-start gap-3 text-[13.5px] text-ink/85">
                <span className={f.confirm ? "mt-0.5 text-warn" : "mt-0.5 text-forest"}>{f.icon}</span>
                <span className="flex-1">
                  {f.text}
                  {f.confirm && (
                    <Badge tone="warn" className="ml-2 align-middle">
                      To confirm
                    </Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {p.restrictions && <p className="mt-4 border-t border-line pt-3 text-[13px] text-muted">Restrictions: {p.restrictions}</p>}
        </Card>
        <Card className="p-6">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-medium text-forest">Next steps</h3>
            <p className="text-[12px] text-muted">
              {steps.filter((s) => s.done).length} of {steps.length} done
            </p>
          </div>
          <ul className="mt-4 space-y-3 text-[13.5px]">
            {steps.map((s) => (
              <li key={s.text} className={s.done ? "flex items-start gap-3 text-muted line-through" : "flex items-start gap-3 text-ink/85"}>
                {s.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-line-strong" />}
                {s.text}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <details className="group mt-6 rounded-2xl border border-line bg-paper shadow-soft">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="font-medium text-forest">Possible plot layouts</span>
            <span className="ml-2 text-[12.5px] text-muted">From the owner&apos;s plot limits. The optimizer picks real sizes.</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-4 px-6 pb-6 md:grid-cols-3">
          {configs.map((c) => (
            <div key={c.name} className="rounded-2xl border border-line bg-cream/50 p-4">
              <p className="text-[13px] font-medium text-forest">{c.name}</p>
              <p className="text-[12px] text-muted">
                {c.count} × {c.size.toFixed(2)} ac = {c.used.toFixed(2)} of {p.cultivableAcres.toFixed(2)} ac
              </p>
              <div className="mt-3 flex h-14 gap-1 overflow-hidden rounded-xl bg-white p-1">
                {Array.from({ length: c.count }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-forest/80" style={{ flex: c.size }} />
                ))}
                {p.cultivableAcres - c.used > 0.001 && <div className="hatch rounded-lg" style={{ flex: p.cultivableAcres - c.used }} />}
              </div>
            </div>
          ))}
          {configs.length === 0 && <p className="text-sm text-muted">The cultivable area is smaller than the minimum plot size.</p>}
        </div>
      </details>
    </div>
  );
}

const FORM_STEPS = ["Where", "Size & rent", "Water & uses"] as const;
const STEP_FIELDS: string[][] = [
  ["name", "location", "region", "seasonalAvailability", "description", "coordinates"],
  ["totalAcres", "cultivableAcres", "reservedAcres", "minPlotAcres", "maxPlotAcres", "maxGrowers", "rentPerAcreMonthly"],
];

function stepOfField(field: string): number {
  const i = STEP_FIELDS.findIndex((fields) => fields.includes(field));
  return i === -1 ? FORM_STEPS.length - 1 : i;
}

function PropertyForm({ initial, isNew, onSave, onCancel }: { initial: Property; isNew: boolean; onSave: (p: Property) => void; onCancel: () => void }) {
  const [p, setP] = useState<Property>(initial);
  const [pinMoved, setPinMoved] = useState(!isNew);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const set = <K extends keyof Property>(k: K, v: Property[K]) => setP((prev) => ({ ...prev, [k]: v }));
  const last = FORM_STEPS.length - 1;

  function validate(): Record<string, string> {
    const parsed = PropertyFormSchema.safeParse(p);
    const coords = CoordinatesSchema.safeParse(p.coordinates);
    return {
      ...(parsed.success ? {} : fieldErrors(parsed.error)),
      ...(coords.success ? {} : { coordinates: coords.error.issues[0]?.message ?? "Pin must be in Nova Scotia." }),
    };
  }

  function next() {
    const here = Object.fromEntries(Object.entries(validate()).filter(([k]) => stepOfField(k) === step));
    setErrors(here);
    if (Object.keys(here).length === 0) setStep((s) => Math.min(last, s + 1));
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    if (step < last && submitter?.dataset.testid !== "save-property") {
      next();
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setStep(Math.min(...Object.keys(errs).map(stepOfField)));
      return;
    }
    setErrors({});
    const id =
      p.id ||
      `${
        p.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40) || "property"
      }-${Date.now().toString(36)}`;
    onSave({ ...p, id, name: p.name.trim(), location: p.location.trim(), listingStatus: p.listingStatus === "draft" ? "ready" : p.listingStatus });
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title={isNew ? "Tell us about your land" : `Edit ${initial.name}`}
        description="Share what you know. Anything unconfirmed is labelled, not guessed."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <ol className="flex items-center gap-2" aria-label="Listing steps" data-testid="form-steps">
            {FORM_STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  aria-current={i === step ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full p-1 text-[13px] transition-colors sm:pr-3",
                    i === step ? "bg-forest pr-3 text-paper" : "text-muted hover:bg-cream hover:text-forest",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold",
                      i === step ? "bg-paper/20" : i < step ? "bg-sage-soft text-forest" : "border border-line-strong",
                    )}
                  >
                    {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={cn("whitespace-nowrap", i !== step && "hidden sm:inline")}>{label}</span>
                </button>
                {i < last && <span className="h-px flex-1 bg-line" />}
              </li>
            ))}
          </ol>

          {step === 0 && (
            <Card className="p-6">
              <h3 className="font-medium text-forest">Where is your land?</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Property name" required error={errors.name}>
                  {(id) => (
                    <Input
                      id={id}
                      value={p.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Harbour Valley Farm"
                      invalid={!!errors.name}
                    />
                  )}
                </Field>
                <Field label="Location or approximate address" required error={errors.location} hint="Approximate is fine. It stays in your browser.">
                  {(id) => (
                    <Input
                      id={id}
                      value={p.location}
                      onChange={(e) => set("location", e.target.value)}
                      placeholder="e.g. Annapolis Valley, NS"
                      invalid={!!errors.location}
                    />
                  )}
                </Field>
                <Field label="Region" hint="Used for approximate travel distances">
                  {(id) => (
                    <Select
                      id={id}
                      value={p.region}
                      onChange={(e) => {
                        const region = e.target.value as Region;
                        setP((prev) => ({ ...prev, region, coordinates: pinMoved ? prev.coordinates : { ...REGION_CENTROIDS[region] } }));
                      }}
                    >
                      {REGIONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Seasonal availability">
                  {(id) => (
                    <Select id={id} value={p.seasonalAvailability} onChange={(e) => set("seasonalAvailability", e.target.value as Season)}>
                      {(Object.keys(SEASON_LABELS) as Season[]).map((s) => (
                        <option key={s} value={s}>
                          {SEASON_LABELS[s]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  {(id) => (
                    <Textarea
                      id={id}
                      value={p.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="What is the land like, and what would you like to see happen?"
                    />
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-medium text-ink">Pin your land (approximate)</p>
                    <p className="text-[11.5px] text-muted tabular-nums">
                      {p.coordinates.lat.toFixed(3)}, {p.coordinates.lng.toFixed(3)}
                    </p>
                  </div>
                  <PinPickerMap
                    value={p.coordinates}
                    onChange={(c) => {
                      setPinMoved(true);
                      set("coordinates", c);
                    }}
                    className="mt-1.5 h-60"
                  />
                  {errors.coordinates ? (
                    <p className="mt-1.5 text-xs text-danger" role="alert">
                      {errors.coordinates}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-muted">Click or drag the pin. A rough spot is enough.</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {step === 1 && (
            <Card className="p-6">
              <h3 className="font-medium text-forest">How much land, and at what rent?</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Field label="Available land area (ac)" required error={errors.totalAcres}>
                  {(id) => <NumberInput id={id} value={p.totalAcres} min={0} max={1000} onCommit={(v) => set("totalAcres", v)} />}
                </Field>
                <Field label="Estimated cultivable (ac)" required error={errors.cultivableAcres}>
                  {(id) => <NumberInput id={id} value={p.cultivableAcres} min={0} max={1000} onCommit={(v) => set("cultivableAcres", v)} />}
                </Field>
                <Field label="Reserved / shared (ac)" error={errors.reservedAcres} hint="Yard, parking, access">
                  {(id) => <NumberInput id={id} value={p.reservedAcres} min={0} max={1000} onCommit={(v) => set("reservedAcres", v)} />}
                </Field>
                <Field label="Minimum plot (ac)" required error={errors.minPlotAcres}>
                  {(id) => <NumberInput id={id} value={p.minPlotAcres} min={0} max={1000} onCommit={(v) => set("minPlotAcres", v)} />}
                </Field>
                <Field label="Maximum plot (ac)" required error={errors.maxPlotAcres}>
                  {(id) => <NumberInput id={id} value={p.maxPlotAcres} min={0} max={1000} onCommit={(v) => set("maxPlotAcres", v)} />}
                </Field>
                <Field label="Max number of growers" error={errors.maxGrowers}>
                  {(id) => <NumberInput id={id} value={p.maxGrowers} min={1} max={20} step={1} onCommit={(v) => set("maxGrowers", Math.round(v))} />}
                </Field>
                <Field label="Preferred rent ($/acre/month)" error={errors.rentPerAcreMonthly} hint="CAD, before negotiation">
                  {(id) => <NumberInput id={id} value={p.rentPerAcreMonthly} min={0} max={10000} step={5} onCommit={(v) => set("rentPerAcreMonthly", v)} />}
                </Field>
              </div>
            </Card>
          )}

          {step === 2 && (
            <>
              <Card className="p-6">
                <h3 className="font-medium text-forest">Water, soil &amp; access</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Water availability" hint="Choose 'reported by owner' unless it has been checked">
                    {(id) => (
                      <Select id={id} value={p.water} onChange={(e) => set("water", e.target.value as WaterStatus)}>
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
                      <Select id={id} value={p.irrigation} onChange={(e) => set("irrigation", e.target.value as IrrigationStatus)}>
                        {(Object.keys(IRRIGATION_LABELS) as IrrigationStatus[]).map((w) => (
                          <option key={w} value={w}>
                            {IRRIGATION_LABELS[w]}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Field label="Soil information, if known" className="sm:col-span-2">
                    {(id) => (
                      <Input id={id} value={p.soilInfo} onChange={(e) => set("soilInfo", e.target.value)} placeholder="e.g. sandy loam, previously hay" />
                    )}
                  </Field>
                  <div className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5">
                    <span className="text-[13px] font-medium">Vehicle access</span>
                    <Switch checked={p.vehicleAccess} onChange={(v) => set("vehicleAccess", v)} label="Vehicle access" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5">
                    <span className="text-[13px] font-medium">Lab soil test on file</span>
                    <Switch checked={p.soilTested} onChange={(v) => set("soilTested", v)} label="Soil tested" />
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-[13px] font-medium">Shared facilities</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ALL_FACILITIES.map((f) => (
                      <ChipToggle
                        key={f}
                        checked={p.sharedFacilities.includes(f)}
                        onChange={(on) => set("sharedFacilities", on ? [...p.sharedFacilities, f] : p.sharedFacilities.filter((x) => x !== f))}
                      >
                        {FACILITY_LABELS[f]}
                      </ChipToggle>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-medium text-forest">Permitted activities &amp; restrictions</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ALL_ACTIVITIES.map((a) => (
                    <ChipToggle
                      key={a}
                      checked={p.allowedActivities.includes(a)}
                      onChange={(on) => set("allowedActivities", on ? [...p.allowedActivities, a] : p.allowedActivities.filter((x) => x !== a))}
                    >
                      {ACTIVITY_LABELS[a]}
                    </ChipToggle>
                  ))}
                </div>
                {errors.allowedActivities && <p className="mt-2 text-xs text-danger">{errors.allowedActivities}</p>}
                <Field label="Additional restrictions" className="mt-4">
                  {(id) => (
                    <Textarea
                      id={id}
                      value={p.restrictions}
                      onChange={(e) => set("restrictions", e.target.value)}
                      placeholder="e.g. no livestock, quiet hours"
                    />
                  )}
                </Field>
              </Card>
            </>
          )}

          <div className="flex items-center justify-between gap-2">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <span />
            )}
            {step < last && (
              <Button variant="secondary" onClick={next} data-testid="form-next">
                Continue to {FORM_STEPS[step + 1].toLowerCase()} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[120px] lg:self-start">
          <Card className="p-5">
            <p className="text-[12px] font-semibold tracking-[0.14em] text-gold-deep uppercase">Summary</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Cultivable</dt>
                <dd className="font-medium">{p.cultivableAcres.toFixed(2)} ac</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Reserved</dt>
                <dd className="font-medium">{p.reservedAcres.toFixed(2)} ac</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Not offered</dt>
                <dd className="font-medium">{Math.max(0, p.totalAcres - p.cultivableAcres - p.reservedAcres).toFixed(2)} ac</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="text-muted">Plot range</dt>
                <dd className="font-medium">
                  {p.minPlotAcres.toFixed(2)}–{p.maxPlotAcres.toFixed(2)} ac
                </dd>
              </div>
            </dl>
            {Object.keys(errors).length > 0 && (
              <p className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-[12.5px] text-danger" role="alert">
                Please fix {Object.keys(errors).length} field{Object.keys(errors).length === 1 ? "" : "s"} before saving.
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <Button type="submit" size="lg" data-testid="save-property">
                <Save className="h-4 w-4" /> Save listing
              </Button>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </Card>
          <p className="px-1 text-[12px] leading-relaxed text-muted">
            Saved to your browser for this demo only. Acre Circle does not verify ownership, boundaries, water or soil. These remain flagged until confirmed.
          </p>
        </aside>
      </div>
    </form>
  );
}
