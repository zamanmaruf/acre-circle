"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Inbox, LayoutGrid, MapPin, Search } from "lucide-react";
import { PageHeader, useEffectiveRole } from "@/components/app-shell";
import { RequestTimeline } from "@/components/request-timeline";
import { Badge, Button, ButtonLink, Card, EmptyState, Select } from "@/components/ui";
import { FIT_TONE, fitFor } from "@/lib/fit";
import { formatCurrency } from "@/lib/labels";
import { DURATION, EASE } from "@/lib/motion";
import { REQUEST_STATUS_LABELS } from "@/lib/requests";
import { useDemoStore } from "@/lib/store";
import type { PlotRequest } from "@/lib/types";

const STATUS_TONE: Record<PlotRequest["status"], "neutral" | "info" | "sage" | "danger"> = {
  sent: "neutral",
  viewed: "info",
  accepted: "sage",
  declined: "danger",
};

export function RequestsView() {
  const { state, hydrated, actingGrower, setActingGrower, setActiveProperty } = useDemoStore();
  const router = useRouter();
  const isGrower = useEffectiveRole() === "grower";
  const mine = state.requests
    .filter((r) => r.growerId === state.actingGrowerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  const propertyById = new Map(state.properties.map((p) => [p.id, p]));

  function openPlan(propertyId: string) {
    setActiveProperty(propertyId);
    router.push("/optimizer");
  }

  return (
    <div>
      <PageHeader
        title={isGrower ? "My plot requests" : "Grower requests"}
        description={isGrower ? "Requests you've sent and where they stand." : "Requests sent by the selected grower."}
        actions={
          <Select aria-label={isGrower ? "Acting grower" : "Grower"} value={state.actingGrowerId} onChange={(e) => setActingGrower(e.target.value)} className="w-64">
            {state.growers.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        }
      />

      {!hydrated ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading requests">
          <div className="skeleton h-[260px] rounded-3xl" />
        </div>
      ) : mine.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title={`${actingGrower?.name ?? "This grower"} hasn't requested a plot yet`}
          body="Browse listings on the map, check your fit, and send a short note to the owner. It takes under a minute."
          action={
            <ButtonLink href="/explore">
              <Search className="h-4 w-4" /> Explore land
            </ButtonLink>
          }
        />
      ) : (
        <motion.ul className="space-y-4" data-testid="my-requests" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
          <AnimatePresence initial={false}>
            {mine.map((r) => {
              const p = propertyById.get(r.propertyId);
              if (!p) return null;
              const fit = actingGrower ? fitFor(p, actingGrower) : null;
              return (
                <motion.li
                  key={r.id}
                  layout
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
                >
                  <Card className="overflow-hidden" data-testid={`request-${r.propertyId}`}>
                    <div className="grid gap-0 md:grid-cols-[180px_1fr]">
                      <div className="relative h-36 md:h-full">
                        <Image src={p.image} alt="" fill sizes="180px" className="object-cover" />
                      </div>
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-serif text-xl text-forest">{p.name}</p>
                            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
                              <MapPin className="h-3 w-3" /> {p.location}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {fit && <Badge tone={FIT_TONE[fit.level]}>{fit.label}</Badge>}
                            <Badge tone={STATUS_TONE[r.status]}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                          </div>
                        </div>
                        <p className="mt-2 text-[13px] text-ink/80">
                          {r.requestedAcres.toFixed(2)} ac requested · about {formatCurrency(r.requestedAcres * p.rentPerAcreMonthly)}/mo at the asking rate
                        </p>
                        <blockquote className="mt-2 rounded-xl bg-cream/70 px-3 py-2 text-[13px] text-ink/80 italic">“{r.message}”</blockquote>
                        <div className="mt-4 max-w-md">
                          <RequestTimeline request={r} />
                        </div>
                        {r.status === "declined" && r.declineReason && (
                          <p className="mt-3 rounded-xl border border-danger/20 bg-danger-soft/50 px-3 py-2 text-[13px] text-ink/85">
                            <span className="font-medium text-danger">Owner&apos;s reason:</span> {r.declineReason}
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {r.status === "accepted" ? (
                            <Button size="sm" onClick={() => openPlan(p.id)} data-testid="open-plan">
                              <LayoutGrid className="h-3.5 w-3.5" /> See the shared plot plan
                            </Button>
                          ) : r.status === "declined" ? (
                            <ButtonLink href="/explore" size="sm">
                              Find other land <ArrowRight className="h-3.5 w-3.5" />
                            </ButtonLink>
                          ) : (
                            <p className="text-[12.5px] text-muted">Waiting for the owner. You&apos;ll get a notification when they respond.</p>
                          )}
                          <ButtonLink href={`/explore?property=${p.id}`} size="sm" variant="ghost">
                            View on map
                          </ButtonLink>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
