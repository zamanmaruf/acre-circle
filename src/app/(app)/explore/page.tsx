"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Car, Droplets, MapPin, Plus, Ruler, Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Badge, Button, ButtonLink, Card, ChipToggle, EmptyState, SyntheticBadge } from "@/components/ui";
import { candidatesFor } from "@/lib/engine/allocate";
import { formatCurrency, WATER_LABELS } from "@/lib/labels";
import { useDemoStore } from "@/lib/store";

export default function ExplorePage() {
  const { state, setActiveProperty } = useDemoStore();
  const router = useRouter();
  const regions = Array.from(new Set(state.properties.map((p) => p.region)));
  const [region, setRegion] = useState<string | null>(null);
  const visible = state.properties.filter((p) => !region || p.region === region);

  return (
    <div>
      <PageHeader
        eyebrow="Explore land"
        title="Land open to sharing"
        description="Fictional example listings for this demonstration. None of these properties is actually available, and owner-supplied details have not been verified."
        actions={
          <ButtonLink href="/landowner?mode=new">
            <Plus className="h-4 w-4" /> List Your Land
          </ButtonLink>
        }
      />
      <div className="mb-5 flex flex-wrap gap-1.5">
        <ChipToggle checked={region === null} onChange={() => setRegion(null)}>
          All regions · {state.properties.length}
        </ChipToggle>
        {regions.map((r) => (
          <ChipToggle key={r} checked={region === r} onChange={() => setRegion(r)}>
            {r}
          </ChipToggle>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={<MapPin className="h-5 w-5" />} title="No listings in this region" body="Try another region or list your own land." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => {
            const applicants = candidatesFor(p, state.growers).length;
            return (
              <Card key={p.id} className="group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lift">
                <div className="relative h-48 overflow-hidden">
                  <Image src={p.image} alt="" fill sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/60 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <SyntheticBadge />
                  </div>
                  <div className="absolute right-3 bottom-3">
                    <Badge tone={p.listingStatus === "ready" ? "sage" : p.listingStatus === "in-review" ? "gold" : "neutral"}>
                      {p.listingStatus === "ready" ? "Ready for matching" : p.listingStatus === "in-review" ? "In review" : "Draft"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-serif text-[22px] text-forest">{p.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                    <MapPin className="h-3.5 w-3.5" /> {p.location}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
                    <span className="flex items-center gap-1.5 text-ink/80">
                      <Ruler className="h-3.5 w-3.5 text-muted" /> {p.cultivableAcres.toFixed(2)} of {p.totalAcres.toFixed(2)} ac
                    </span>
                    <span className="flex items-center gap-1.5 text-ink/80">
                      <Users className="h-3.5 w-3.5 text-muted" /> {applicants} applicant{applicants === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1.5 text-ink/80">
                      <Droplets className="h-3.5 w-3.5 text-muted" /> {WATER_LABELS[p.water]}
                    </span>
                    <span className="flex items-center gap-1.5 text-ink/80">
                      <Car className="h-3.5 w-3.5 text-muted" /> {p.vehicleAccess ? "Vehicle access" : "Walk-in only"}
                    </span>
                  </div>
                  <p className="mt-3 text-[12.5px] text-muted">
                    Plots {p.minPlotAcres.toFixed(2)}–{p.maxPlotAcres.toFixed(2)} ac · {formatCurrency(p.rentPerAcreMonthly)}/ac/mo asked
                  </p>
                  <div className="mt-auto flex gap-2 pt-5">
                    <ButtonLink href={`/landowner?property=${p.id}`} variant="secondary" size="sm" className="flex-1">
                      View Property
                    </ButtonLink>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setActiveProperty(p.id);
                        router.push("/optimizer");
                      }}
                    >
                      Match growers <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="mt-6 text-[12px] text-muted">
        Looking for land as a grower? <Link href="/growers" className="text-forest underline">Create a grower profile</Link> and apply to a listing.
      </p>
    </div>
  );
}
