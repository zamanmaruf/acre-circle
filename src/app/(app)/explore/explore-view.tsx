"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Car, Droplets, LayoutGrid, MapPin, Plus, Ruler, Send, Users, X } from "lucide-react";
import { PageHeader, useEffectiveRole } from "@/components/app-shell";
import { BottomSheet } from "@/components/bottom-sheet";
import { CheckList } from "@/components/candidate-card";
import { LandMap } from "@/components/land-map";
import { RequestDialog } from "@/components/request-dialog";
import { Badge, Button, ButtonLink, ChipToggle, cn, EmptyState, Select } from "@/components/ui";
import { candidatesFor } from "@/lib/engine/allocate";
import { REGION_CENTROIDS } from "@/lib/engine/regions";
import { FIT_TONE, fitFor, type Fit } from "@/lib/fit";
import { formatCurrency, WATER_LABELS } from "@/lib/labels";
import { DURATION, EASE } from "@/lib/motion";
import { REQUEST_STATUS_LABELS } from "@/lib/requests";
import { useDemoStore } from "@/lib/store";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Property } from "@/lib/types";

const STATUS_LABEL: Record<Property["listingStatus"], string> = { ready: "Ready for matching", "in-review": "In review", draft: "Draft" };

export function ExploreView() {
  const { state, actingGrower, setActingGrower, setActiveProperty } = useDemoStore();
  const role = useEffectiveRole();
  const params = useSearchParams();
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [region, setRegion] = useState<string | null>(null);
  const [inRange, setInRange] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get("property"));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<Property | null>(null);
  const [sheetSnap, setSheetSnap] = useState(selectedId ? 1 : 0);
  const growerMode = role === "grower" && !!actingGrower;

  const regions = Array.from(new Set(state.properties.map((p) => p.region)));
  const fits = useMemo(() => {
    const m = new Map<string, Fit>();
    if (actingGrower) for (const p of state.properties) m.set(p.id, fitFor(p, actingGrower));
    return m;
  }, [state.properties, actingGrower]);

  const inTravelRange = (p: Property) => !fits.get(p.id)?.evaluation?.checks.some((c) => c.id === "travel" && c.status === "fail");
  const visible = state.properties.filter((p) => (!region || p.region === region) && (!growerMode || !inRange || inTravelRange(p)));
  const selected = selectedId ? state.properties.find((p) => p.id === selectedId) ?? null : null;

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    setSheetSnap(id ? 1 : 0);
    window.history.replaceState(null, "", id ? `?property=${encodeURIComponent(id)}` : window.location.pathname);
  }, []);

  const travelCircle = growerMode
    ? { center: REGION_CENTROIDS[actingGrower.region], km: actingGrower.maxTravelKm, label: `${actingGrower.maxTravelKm} km from ${actingGrower.region} (approximate)` }
    : null;

  const filters = (
    <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0 [&>*]:shrink-0 [&>*]:whitespace-nowrap">
      <ChipToggle checked={region === null} onChange={() => setRegion(null)}>
        All regions · {state.properties.length}
      </ChipToggle>
      {regions.map((r) => (
        <ChipToggle key={r} checked={region === r} onChange={() => setRegion(region === r ? null : r)}>
          {r}
        </ChipToggle>
      ))}
      {growerMode && (
        <ChipToggle checked={inRange} onChange={setInRange}>
          Within my travel range
        </ChipToggle>
      )}
    </div>
  );

  const list = (
    <div className="space-y-2.5" data-testid="listing-list">
      {visible.length === 0 && (
        <EmptyState icon={<MapPin className="h-5 w-5" />} title="No listings match" body="Try another region, or turn off the travel filter." />
      )}
      <AnimatePresence initial={false}>
        {visible.map((p, i) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate, delay: Math.min(i, 6) * 0.04 }}
          >
            <ListingCard
              property={p}
              fit={growerMode ? fits.get(p.id) : undefined}
              applicants={candidatesFor(p, state.growers).length}
              active={p.id === selectedId}
              hovered={p.id === hoveredId}
              onSelect={() => select(p.id)}
              onHover={(on) => setHoveredId(on ? p.id : null)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const panel = selected && (
    <PropertyPanel
      key={selected.id}
      property={selected}
      fit={growerMode ? fits.get(selected.id) : undefined}
      growerMode={growerMode}
      requestStatus={state.requests.find((r) => r.propertyId === selected.id && r.growerId === state.actingGrowerId)?.status}
      applicants={candidatesFor(selected, state.growers).length}
      onClose={() => select(null)}
      onRequest={() => setRequesting(selected)}
      onPlan={() => {
        setActiveProperty(selected.id);
        router.push("/optimizer");
      }}
    />
  );

  return (
    <div>
      <PageHeader
        title={growerMode ? "Find a plot near you" : "Land open to sharing"}
        description={growerMode ? "Pick a pin to see how it fits you." : "Listings open to shared micro-plots."}
        actions={
          growerMode ? (
            <Select aria-label="Acting grower" value={state.actingGrowerId} onChange={(e) => setActingGrower(e.target.value)} className="h-9 w-56 text-[13px]">
              {state.growers.map((g) => (
                <option key={g.id} value={g.id}>
                  Viewing as {g.name}
                </option>
              ))}
            </Select>
          ) : (
            <ButtonLink href="/landowner?mode=new">
              <Plus className="h-4 w-4" /> List Your Land
            </ButtonLink>
          )
        }
      />
      <div className="mb-4">{filters}</div>

      {isDesktop ? (
        <div className="grid h-[calc(100svh-250px)] min-h-[560px] grid-cols-[380px_1fr] gap-5 xl:grid-cols-[420px_1fr]">
          <div className="-mr-2 overflow-y-auto pr-2 pb-2">{list}</div>
          <div className="relative overflow-hidden rounded-[24px] border border-line shadow-soft">
            <LandMap
              properties={visible}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={(id) => select(id)}
              onHover={setHoveredId}
              focusIds={region ? visible.map((p) => p.id) : undefined}
              travelCircle={travelCircle}
              insets={{ right: 392 }}
              className="absolute inset-0"
            />
            <AnimatePresence>
              {selected && (
                <motion.div
                  key={selected.id}
                  className="absolute top-3 right-3 bottom-3 z-10 w-[380px] overflow-hidden rounded-[20px] border border-line bg-paper shadow-lift"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24, transition: { duration: DURATION.short, ease: EASE.emphasizedAccelerate } }}
                  transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
                >
                  <div className="h-full overflow-y-auto">{panel}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="relative -mx-4 h-[calc(100svh-210px)] min-h-[520px] overflow-hidden border-y border-line sm:-mx-6">
          <LandMap
            properties={visible}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={(id) => select(id)}
            onHover={setHoveredId}
            focusIds={region ? visible.map((p) => p.id) : undefined}
            travelCircle={travelCircle}
            insets={{ bottom: 300 }}
            className="absolute inset-0"
          />
          <BottomSheet snap={sheetSnap} onSnapChange={setSheetSnap} label={selected ? `${selected.name} details` : "Listings"}>
            {selected ? panel : (
              <>
                <p className="mb-3 text-[13px] font-medium text-forest">
                  {visible.length} listing{visible.length === 1 ? "" : "s"}
                </p>
                {list}
              </>
            )}
          </BottomSheet>
        </div>
      )}

      {requesting && <RequestDialog property={requesting} open={!!requesting} onClose={() => setRequesting(null)} />}
    </div>
  );
}

function ListingCard({
  property: p,
  fit,
  applicants,
  active,
  hovered,
  onSelect,
  onHover,
}: {
  property: Property;
  fit?: Fit;
  applicants: number;
  active: boolean;
  hovered: boolean;
  onSelect: () => void;
  onHover: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      aria-pressed={active}
      data-testid={`listing-${p.id}`}
      className={cn(
        "state-layer flex w-full gap-3 rounded-2xl border bg-paper p-2.5 text-left transition-[border-color,box-shadow,transform] duration-200",
        active ? "border-gold shadow-lift" : hovered ? "border-forest/30 shadow-soft" : "border-line",
      )}
    >
      <div className="relative h-[84px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-cream">
        {!active ? (
          <motion.div layoutId={`property-image-${p.id}`} className="absolute inset-0" transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}>
            <Image src={p.image} alt="" fill sizes="96px" className="object-cover" />
          </motion.div>
        ) : (
          <Image src={p.image} alt="" fill sizes="96px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-serif text-[17px] leading-tight text-forest">{p.name}</p>
          {fit ? <Badge tone={FIT_TONE[fit.level]}>{fit.label}</Badge> : null}
        </div>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted">
          <MapPin className="h-3 w-3 shrink-0" /> {p.location}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink/80">
          <span className="flex items-center gap-1">
            <Ruler className="h-3 w-3 text-muted" /> {p.cultivableAcres.toFixed(2)} ac
          </span>
          <span>{formatCurrency(p.rentPerAcreMonthly)}/ac/mo</span>
          {!fit && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted" /> {applicants} applicant{applicants === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function PropertyPanel({
  property: p,
  fit,
  growerMode,
  requestStatus,
  applicants,
  onClose,
  onRequest,
  onPlan,
}: {
  property: Property;
  fit?: Fit;
  growerMode: boolean;
  requestStatus?: string;
  applicants: number;
  onClose: () => void;
  onRequest: () => void;
  onPlan: () => void;
}) {
  const checks = fit?.evaluation?.checks ?? [];
  const facts = [
    { icon: <Ruler className="h-3.5 w-3.5" />, k: "Cultivable", v: `${p.cultivableAcres.toFixed(2)} of ${p.totalAcres.toFixed(2)} ac` },
    { icon: <LayoutGrid className="h-3.5 w-3.5" />, k: "Plot sizes", v: `${p.minPlotAcres.toFixed(2)}–${p.maxPlotAcres.toFixed(2)} ac` },
    { icon: <Droplets className="h-3.5 w-3.5" />, k: "Water", v: WATER_LABELS[p.water] },
    { icon: <Car className="h-3.5 w-3.5" />, k: "Access", v: p.vehicleAccess ? "Vehicle access" : "Walk-in only" },
  ];
  return (
    <div data-testid="property-panel">
      <div className="relative h-40 overflow-hidden rounded-[16px] lg:rounded-none">
        <motion.div layoutId={`property-image-${p.id}`} className="absolute inset-0" transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}>
          <Image src={p.image} alt="" fill sizes="380px" className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/70 to-transparent" />
        <button
          type="button"
          onClick={onClose}
          className="state-layer absolute top-2.5 right-2.5 rounded-full bg-paper/90 p-1.5 text-forest shadow-soft"
          aria-label="Close property details"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-2">
          <p className="font-serif text-[24px] leading-tight text-paper">{p.name}</p>
          <Badge tone={p.listingStatus === "ready" ? "sage" : "gold"}>{STATUS_LABEL[p.listingStatus]}</Badge>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
          <MapPin className="h-3.5 w-3.5" /> {p.location}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {facts.map((f) => (
            <div key={f.k} className="rounded-xl bg-cream/70 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[11.5px] text-muted">
                {f.icon} {f.k}
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-forest">{f.v}</p>
            </div>
          ))}
        </div>
        <div className="flex items-baseline justify-between rounded-xl border border-line px-3 py-2.5">
          <span className="text-[12.5px] text-muted">Owner&apos;s asking rate</span>
          <span className="font-serif text-xl text-forest">{formatCurrency(p.rentPerAcreMonthly)}/ac/mo</span>
        </div>

        {fit && (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-forest">How this fits you</p>
              <Badge tone={FIT_TONE[fit.level]}>{fit.label}</Badge>
            </div>
            <CheckList checks={checks} className="mt-1" />
          </div>
        )}
        {!growerMode && (
          <p className="flex items-center gap-1.5 text-[13px] text-ink/80">
            <Users className="h-3.5 w-3.5 text-muted" /> {applicants} applicant{applicants === 1 ? "" : "s"} so far
          </p>
        )}

        <div className="space-y-2 pt-1">
          {growerMode &&
            (requestStatus ? (
              <Link href="/requests" className="flex items-center justify-between rounded-xl bg-sage-soft px-3 py-2.5 text-[13px] text-forest">
                <span>
                  Your request: <strong>{REQUEST_STATUS_LABELS[requestStatus as keyof typeof REQUEST_STATUS_LABELS]}</strong>
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Button className="w-full" size="lg" onClick={onRequest} data-testid="request-plot" disabled={fit?.level === "no"}>
                <Send className="h-4 w-4" /> Request a plot
              </Button>
            ))}
          {growerMode && fit?.level === "no" && !requestStatus && (
            <p className="text-center text-[12px] text-muted">Requests are disabled when a hard requirement fails.</p>
          )}
          {!growerMode && (
            <Button className="w-full" onClick={onPlan}>
              <LayoutGrid className="h-4 w-4" /> Plan plots for this listing
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            {growerMode && (
              <Button variant="secondary" size="sm" onClick={onPlan}>
                Shared plot plan
              </Button>
            )}
            <ButtonLink href={`/landowner?property=${p.id}`} variant="ghost" size="sm" className={cn(!growerMode && "col-span-2")}>
              Full listing
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
