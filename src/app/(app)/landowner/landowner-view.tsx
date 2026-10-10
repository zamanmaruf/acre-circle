"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  Car,
  CheckCircle2,
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
import { Badge, Button, ButtonLink, Card, ChipToggle, Field, Input, Select, Switch, SyntheticBadge, Textarea } from "@/components/ui";
import { candidatesFor } from "@/lib/engine/allocate";
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
import { fieldErrors, PropertyFormSchema } from "@/lib/schemas";
import { useDemoStore } from "@/lib/store";
import type { IrrigationStatus, Property, Region, Season, WaterStatus } from "@/lib/types";

function blankProperty(): Property {
  return {
    id: "",
    name: "",
    ownerName: "Demo landowner (synthetic)",
    location: "",
    region: "Annapolis Valley",
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
  onFindGrowers,
}: {
  property: Property;
  saved: boolean;
  applicants: number;
  onFindGrowers: () => void;
}) {
  const known = [
    { icon: <Ruler className="h-4 w-4" />, text: `${p.totalAcres.toFixed(2)} ac total; owner estimates ${p.cultivableAcres.toFixed(2)} ac cultivable` },
    { icon: <Car className="h-4 w-4" />, text: p.vehicleAccess ? "Vehicle access (owner-reported)" : "Walk-in access only" },
    {
      icon: <Warehouse className="h-4 w-4" />,
      text: p.sharedFacilities.length ? `Shared: ${p.sharedFacilities.map((f) => FACILITY_LABELS[f].toLowerCase()).join(", ")}` : "No shared facilities listed",
    },
    { icon: <CheckCircle2 className="h-4 w-4" />, text: `Permitted: ${p.allowedActivities.map((a) => ACTIVITY_LABELS[a].toLowerCase()).join(", ")}` },
    { icon: <ScrollText className="h-4 w-4" />, text: SEASON_LABELS[p.seasonalAvailability] },
  ];
  const unverified = [
    p.water !== "verified" && { icon: <Droplets className="h-4 w-4" />, text: `Water: ${WATER_LABELS[p.water]}` },
    p.irrigation === "unverified" && { icon: <Droplets className="h-4 w-4" />, text: "Irrigation capacity not verified" },
    !p.soilTested && { icon: <FlaskConical className="h-4 w-4" />, text: `Soil: ${p.soilInfo || "no information"} (no lab test)` },
    { icon: <CircleHelp className="h-4 w-4" />, text: "Ownership and right to lease not verified by Acre Circle" },
    { icon: <CircleHelp className="h-4 w-4" />, text: "Boundaries and acreage not surveyed" },
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];
  const configs = configurations(p);
  const maxPlots = Math.min(p.maxGrowers, Math.floor((p.cultivableAcres + 1e-9) / p.minPlotAcres));

  return (
    <div>
      {saved && (
        <div className="mb-5 flex animate-fade-up items-center gap-2 rounded-2xl border border-sage bg-sage-soft px-4 py-3 text-sm text-forest">
          <CheckCircle2 className="h-4 w-4" /> Listing saved to this demo session. It is now the active property for matching.
        </div>
      )}
      <PageHeader
        eyebrow="Landowner · property listing"
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
                <SyntheticBadge />
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
          <p className="text-[11.5px] font-semibold tracking-[0.16em] text-gold-deep uppercase">Land opportunity summary</p>
          <p className="mt-3 font-serif text-[22px] leading-snug text-forest">
            Up to {maxPlots} micro-plot{maxPlots === 1 ? "" : "s"} could fit within {p.cultivableAcres.toFixed(2)} cultivable acres, using the owner&apos;s{" "}
            {p.minPlotAcres.toFixed(2)}–{p.maxPlotAcres.toFixed(2)} ac plot limits.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {p.reservedAcres.toFixed(2)} ac stays reserved for shared tools, parking and access. {applicants} applicant{applicants === 1 ? " has" : "s have"}{" "}
            expressed interest. The optimizer will check each one against these constraints.
          </p>
          <div className="mt-auto pt-6">
            <Button size="lg" className="w-full" onClick={onFindGrowers} data-testid="find-growers">
              <Users className="h-4 w-4" /> Find Compatible Growers <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-medium text-forest">Known features</h3>
          <p className="text-[12px] text-muted">As described by the owner</p>
          <ul className="mt-4 space-y-3">
            {known.map((k) => (
              <li key={k.text} className="flex gap-3 text-[13.5px] text-ink/85">
                <span className="mt-0.5 text-forest">{k.icon}</span>
                {k.text}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="border-warn/25 p-6">
          <h3 className="font-medium text-warn">Unverified information</h3>
          <p className="text-[12px] text-muted">Must be confirmed before any agreement</p>
          <ul className="mt-4 space-y-3">
            {unverified.map((k) => (
              <li key={k.text} className="flex gap-3 text-[13.5px] text-ink/85">
                <span className="mt-0.5 text-warn">{k.icon}</span>
                {k.text}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h3 className="font-medium text-forest">Suggested next steps</h3>
          <ol className="mt-4 space-y-3 text-[13.5px] text-ink/85">
            {[
              p.water !== "verified" ? "Arrange a water-source check (flow and reliability)." : "Water verified. Document the source and its capacity.",
              !p.soilTested ? "Order a basic soil test before the growing season." : "Share the soil test with applicants.",
              "Confirm ownership documents and any municipal or insurance requirements.",
              "Run the optimizer to see compatible growers and a plot plan.",
              "Meet shortlisted growers on site before drafting terms.",
            ].map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[11px] font-semibold text-forest">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-medium text-forest">Potential micro-plot configurations</h3>
            <p className="text-[12.5px] text-muted">
              Illustrative layouts from the owner&apos;s plot limits only. The optimizer decides actual sizes from real applicants.
            </p>
          </div>
          {p.restrictions && <Badge tone="neutral">Restrictions: {p.restrictions}</Badge>}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
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
      </Card>
    </div>
  );
}

function PropertyForm({
  initial,
  isNew,
  onSave,
  onCancel,
}: {
  initial: Property;
  isNew: boolean;
  onSave: (p: Property) => void;
  onCancel: () => void;
}) {
  const [p, setP] = useState<Property>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof Property>(k: K, v: Property[K]) => setP((prev) => ({ ...prev, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = PropertyFormSchema.safeParse(p);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    const id =
      p.id ||
      `${p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "property"}-${Date.now().toString(36)}`;
    onSave({ ...p, id, name: p.name.trim(), location: p.location.trim(), listingStatus: p.listingStatus === "draft" ? "ready" : p.listingStatus });
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        eyebrow={isNew ? "List your land" : "Edit listing"}
        title={isNew ? "Tell us about your land" : `Edit ${initial.name}`}
        description="Share what you know. Anything you can't confirm is fine. We'll label it as unverified rather than guess. Please use a fictional property for this demo; addresses are not sent anywhere."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-medium text-forest">Property</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Property name" required error={errors.name}>
                {(id) => <Input id={id} value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Harbour Valley Farm" invalid={!!errors.name} />}
              </Field>
              <Field label="Location or approximate address" required error={errors.location} hint="Approximate is fine. Not geocoded.">
                {(id) => <Input id={id} value={p.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Annapolis Valley, NS" invalid={!!errors.location} />}
              </Field>
              <Field label="Region" hint="Used for approximate travel distances">
                {(id) => (
                  <Select id={id} value={p.region} onChange={(e) => set("region", e.target.value as Region)}>
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
                {(id) => <Textarea id={id} value={p.description} onChange={(e) => set("description", e.target.value)} placeholder="What is the land like, and what would you like to see happen?" />}
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-medium text-forest">Area &amp; plots</h3>
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

          <Card className="p-6">
            <h3 className="font-medium text-forest">Resources &amp; access</h3>
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
                {(id) => <Input id={id} value={p.soilInfo} onChange={(e) => set("soilInfo", e.target.value)} placeholder="e.g. sandy loam, previously hay" />}
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
              {(id) => <Textarea id={id} value={p.restrictions} onChange={(e) => set("restrictions", e.target.value)} placeholder="e.g. no livestock, quiet hours" />}
            </Field>
          </Card>
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
