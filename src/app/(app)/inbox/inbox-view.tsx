"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Check, Inbox, LayoutGrid, MapPin, Sprout, Wallet, X } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { CheckIcon } from "@/components/candidate-card";
import { formatRequestDate, RequestTimeline } from "@/components/request-timeline";
import { useToast } from "@/components/toast";
import { Badge, Button, ButtonLink, Card, cn, EmptyState, Field, SyntheticBadge, Textarea } from "@/components/ui";
import { FIT_TONE, fitFor } from "@/lib/fit";
import { formatCurrency } from "@/lib/labels";
import { DURATION, EASE } from "@/lib/motion";
import { isOpen, REQUEST_STATUS_LABELS } from "@/lib/requests";
import { useDemoStore } from "@/lib/store";
import type { Grower, PlotRequest, Property } from "@/lib/types";

type Tab = "open" | "accepted" | "declined";
const TABS: { id: Tab; label: string }[] = [
  { id: "open", label: "Needs a reply" },
  { id: "accepted", label: "Accepted" },
  { id: "declined", label: "Declined" },
];
const QUICK_REASONS = ["Plot sizes don't match what I can offer", "Season already committed", "Planned activity isn't permitted here"];

const inTab = (r: PlotRequest, tab: Tab) => (tab === "open" ? isOpen(r) : r.status === tab);

export function InboxView() {
  const { state, hydrated, markRequestViewed } = useDemoStore();
  const [tab, setTab] = useState<Tab>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = [...state.requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  const visible = sorted.filter((r) => inTab(r, tab));
  const selected = visible.find((r) => r.id === selectedId) ?? visible[0];
  const growerById = new Map(state.growers.map((g) => [g.id, g]));
  const propertyById = new Map(state.properties.map((p) => [p.id, p]));

  const selectedKey = selected?.id;
  const selectedStatus = selected?.status;
  useEffect(() => {
    if (hydrated && selectedKey && selectedStatus === "sent") markRequestViewed(selectedKey);
  }, [hydrated, selectedKey, selectedStatus, markRequestViewed]);

  return (
    <div>
      <PageHeader
        eyebrow="Landowner inbox"
        title="Requests for your land"
        description="Growers who want a plot on your listings. Each request shows the same fit checks the optimizer uses. In this demo you act as the owner of every listed property."
        actions={<SyntheticBadge />}
      />

      <div role="tablist" aria-label="Request status" className="mb-5 inline-flex rounded-full border border-line bg-paper p-1 shadow-soft">
        {TABS.map((t) => {
          const count = state.requests.filter((r) => inTab(r, t.id)).length;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(t.id);
                setSelectedId(null);
              }}
              className={cn("relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors", active ? "text-paper" : "text-muted hover:text-forest")}
            >
              {active && <motion.span layoutId="inbox-tab" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <span className="relative">
                {t.label} <span className={active ? "text-paper/70" : "text-muted"}>{count}</span>
              </span>
            </button>
          );
        })}
      </div>

      {!hydrated ? (
        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]" aria-busy="true" aria-label="Loading requests">
          <div className="space-y-2">
            <div className="skeleton h-[88px] rounded-2xl" />
            <div className="skeleton h-[88px] rounded-2xl" />
          </div>
          <div className="skeleton h-[420px] rounded-3xl" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title={tab === "open" ? "You're all caught up" : `No ${tab} requests yet`}
          body={tab === "open" ? "New plot requests from growers will appear here. Make sure your listing is ready for matching so it shows on the map." : "Requests move here once you reply."}
          action={
            <ButtonLink href="/landowner" variant="secondary">
              Review my listing
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <ul className="min-w-0 space-y-2" data-testid="inbox-list">
            {visible.map((r) => {
              const g = growerById.get(r.growerId);
              const p = propertyById.get(r.propertyId);
              const active = selected?.id === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    aria-pressed={active}
                    data-testid={`inbox-item-${r.id}`}
                    className={cn(
                      "state-layer flex w-full items-start gap-3 rounded-2xl border bg-paper p-3 text-left transition-[border-color,box-shadow]",
                      active ? "border-gold shadow-lift" : "border-line hover:border-forest/30",
                    )}
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft font-serif text-lg text-forest">
                      {g?.name.charAt(0) ?? "?"}
                      {r.status === "sent" && (
                        <>
                          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-gold" aria-hidden />
                          <span className="sr-only">New request.</span>
                        </>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[14px] font-medium text-ink">{g?.name ?? r.growerId}</span>
                        <span className="shrink-0 text-[11px] text-muted">{formatRequestDate(r.createdAt)}</span>
                      </span>
                      <span className="block truncate text-[12px] text-muted">
                        {r.requestedAcres.toFixed(2)} ac at {p?.name ?? r.propertyId}
                      </span>
                      <span className="mt-1 block truncate text-[12px] text-ink/70">{r.message}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <AnimatePresence mode="wait">
            {selected && growerById.get(selected.growerId) && propertyById.get(selected.propertyId) && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8, transition: { duration: DURATION.short } }}
                transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
              >
                <RequestDetail
                  request={selected}
                  grower={growerById.get(selected.growerId)!}
                  property={propertyById.get(selected.propertyId)!}
                  onReplied={(next) => {
                    setTab(next);
                    setSelectedId(selected.id);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function RequestDetail({
  request: r,
  grower: g,
  property: p,
  onReplied,
}: {
  request: PlotRequest;
  grower: Grower;
  property: Property;
  onReplied: (tab: Tab) => void;
}) {
  const { respondToRequest, setActiveProperty, undo } = useDemoStore();
  const toast = useToast();
  const router = useRouter();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | undefined>();
  const fit = fitFor(p, g);
  const checks = [...(fit.evaluation?.checks ?? [])].sort((a, b) => {
    const order = { fail: 0, warn: 1, pending: 2, pass: 3 };
    return order[a.status] - order[b.status];
  });
  const rent = r.requestedAcres * p.rentPerAcreMonthly;

  function openPlan() {
    setActiveProperty(p.id);
    router.push("/optimizer");
  }

  function accept() {
    respondToRequest(r.id, { type: "accept" });
    onReplied("accepted");
    toast({ message: `${g.name} is now an applicant for ${p.name}.`, action: { label: "Undo", onClick: undo } });
  }

  function decline(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setReasonError("Give the grower a short reason so they can look elsewhere.");
      return;
    }
    respondToRequest(r.id, { type: "decline", reason });
    setDeclining(false);
    onReplied("declined");
    toast({ message: `Request from ${g.name} declined.`, action: { label: "Undo", onClick: undo } });
  }

  return (
    <Card className="p-5" data-testid="request-detail">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-muted">
            Request for <span className="font-medium text-ink">{p.name}</span>
          </p>
          <h2 className="font-serif text-2xl text-forest">{g.name}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted">
            <span className="flex items-center gap-1">
              <Sprout className="h-3 w-3" /> {g.cropType}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {g.region}
            </span>
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" /> Budget {formatCurrency(g.budgetMonthly)}/mo
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={FIT_TONE[fit.level]}>{fit.label}</Badge>
          <Badge tone={r.status === "accepted" ? "sage" : r.status === "declined" ? "danger" : "neutral"}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Requested", `${r.requestedAcres.toFixed(2)} ac`],
          ["Your plot range", `${p.minPlotAcres.toFixed(2)}–${p.maxPlotAcres.toFixed(2)} ac`],
          ["At your asking rate", `${formatCurrency(rent)}/mo`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-cream/70 px-3 py-2.5">
            <p className="text-[11.5px] text-muted">{k}</p>
            <p className="font-serif text-lg text-forest">{v}</p>
          </div>
        ))}
      </div>

      <blockquote className="mt-4 rounded-xl border-l-4 border-gold bg-gold-soft/40 px-4 py-3 text-[14px] text-ink/85 italic">“{r.message}”</blockquote>

      <div className="mt-5">
        <h3 className="text-[13px] font-medium text-forest">Fit checks against {p.name}</h3>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.id} className="flex gap-2 rounded-lg px-2 py-1.5 text-[12.5px] leading-snug text-ink/85">
              <CheckIcon status={c.status} className="mt-px" />
              <span>
                <span className="font-medium">{c.label}.</span> {c.detail}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 max-w-md">
        <RequestTimeline request={r} />
      </div>

      {r.status === "declined" && r.declineReason && (
        <p className="mt-4 text-[13px] text-ink/80">
          <span className="font-medium text-danger">You declined:</span> {r.declineReason}
        </p>
      )}

      <div className="mt-5 border-t border-line pt-4">
        {isOpen(r) ? (
          <AnimatePresence mode="wait" initial={false}>
            {declining ? (
              <motion.form
                key="decline"
                onSubmit={decline}
                noValidate
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: DURATION.medium, ease: EASE.emphasizedDecelerate }}
                className="space-y-3"
              >
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REASONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setReason(q);
                        setReasonError(undefined);
                      }}
                      className="state-layer rounded-full border border-line-strong px-3 py-1 text-[12.5px] text-muted hover:text-forest"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <Field label="Reason shared with the grower" required error={reasonError}>
                  {(id) => <Textarea id={id} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} data-testid="decline-reason" />}
                </Field>
                <div className="flex gap-2">
                  <Button type="submit" variant="danger" data-testid="confirm-decline">
                    <X className="h-4 w-4" /> Decline request
                  </Button>
                  <Button variant="ghost" onClick={() => setDeclining(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.form>
            ) : (
              <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2">
                <Button onClick={accept} disabled={fit.level === "no"} data-testid="accept-request">
                  <Check className="h-4 w-4" /> Accept as applicant
                </Button>
                <Button variant="secondary" onClick={() => setDeclining(true)} data-testid="decline-request">
                  Decline
                </Button>
                <p className="w-full text-[12px] text-muted sm:ml-2 sm:w-auto">
                  {fit.level === "no"
                    ? "A hard constraint fails, so this grower can't be placed here. Decline with a reason."
                    : "Accepting adds them to the shared plot plan. Nothing is signed."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        ) : r.status === "accepted" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={openPlan} data-testid="open-in-optimizer">
              <LayoutGrid className="h-4 w-4" /> Open in plot optimizer
            </Button>
            <p className="text-[12.5px] text-muted">Recalculate the plan to see where {g.label} fits alongside other growers.</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
