"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Download, FileSignature, Flag, Pencil, Printer, RotateCcw, Send, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PLOT_COLORS } from "@/components/plot-map";
import { Badge, Button, ButtonLink, Card, cn, EmptyState, Select, Textarea } from "@/components/ui";
import { agreementHtml, agreementKey, DRAFT_DISCLAIMER, generateDraft, PLACEHOLDER, SECTIONS } from "@/lib/agreement";
import { candidatesFor, runAllocation } from "@/lib/engine/allocate";
import { formatCurrency } from "@/lib/labels";
import { useDemoStore } from "@/lib/store";
import type { AgreementDraft, AgreementSectionId } from "@/lib/types";

const PLACEHOLDER_SPLIT = new RegExp(`(${PLACEHOLDER.source})`, "g");

function placeholderCount(value: string): number {
  return value.match(PLACEHOLDER)?.length ?? 0;
}

function DraftText({ value }: { value: string }) {
  return (
    <>
      {value.split(PLACEHOLDER_SPLIT).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-md bg-warn-soft px-1.5 py-0.5 text-[12.5px] font-medium text-warn [box-decoration-break:clone]">
            {part.replace(/^\[TO CONFIRM:?\s*/, "To confirm: ").replace(/\]$/, "")}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function DraftSection({
  id,
  title,
  value,
  flagged,
  onChange,
  onToggleFlag,
}: {
  id: AgreementSectionId;
  title: string;
  value: string;
  flagged: boolean;
  onChange: (value: string) => void;
  onToggleFlag: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const pending = placeholderCount(value);
  return (
    <section id={`section-${id}`} className={cn("group scroll-mt-32", flagged && "border-l-[3px] border-gold pl-4")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-serif text-lg text-forest">
          {title}
          {pending === 0 && <Check className="h-4 w-4 text-forest/60" aria-label="No placeholders" />}
        </h3>
        <div
          className={cn(
            "no-print flex items-center gap-1.5 transition-opacity",
            !flagged && !editing && "sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100",
          )}
        >
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={flagged}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] transition-colors",
              flagged ? "border-gold bg-gold-soft text-gold-deep" : "border-line text-muted hover:border-gold hover:text-gold-deep",
            )}
          >
            <Flag className="h-3 w-3" /> {flagged ? "For discussion" : "Discuss"}
          </button>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-[11.5px] text-muted transition-colors hover:border-forest/40 hover:text-forest"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
        </div>
      </div>
      {editing ? (
        <div className="no-print mt-2">
          <Textarea
            aria-label={title}
            value={value}
            autoFocus
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
            rows={Math.max(3, value.split("\n").length + 1)}
            className="text-[13.5px]"
          />
          <div className="mt-1.5 flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              <Check className="h-3.5 w-3.5" /> Done
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${title}`}
          className="-mx-2 mt-1.5 block w-[calc(100%+1rem)] cursor-text rounded-lg px-2 py-1 text-left text-[14px] leading-relaxed whitespace-pre-line text-ink/90 transition-colors hover:bg-cream/70 print:hidden"
        >
          <DraftText value={value} />
        </button>
      )}
      <p className="hidden text-[13.5px] leading-relaxed whitespace-pre-line print:block">{value}</p>
    </section>
  );
}

export default function AgreementsPage() {
  const { state, activeProperty: property, saveAgreement, setActiveProperty } = useDemoStore();
  const result = useMemo(() => runAllocation(property, candidatesFor(property, state.growers)), [property, state.growers]);
  const [selected, setSelected] = useState<string | null>(null);

  const growerById = new Map(state.growers.map((g) => [g.id, g]));
  const plots = result.plots;
  const selectedId = selected && plots.some((p) => p.growerId === selected) ? selected : plots[0]?.growerId;
  const plot = plots.find((p) => p.growerId === selectedId);
  const grower = selectedId ? growerById.get(selectedId) : undefined;
  const evaluation = result.evaluations.find((e) => e.growerId === selectedId);

  const stored = selectedId ? state.agreements[agreementKey(property.id, selectedId)] : undefined;
  const generated = useMemo(
    () => (plot && grower && evaluation ? generateDraft(property, grower, plot, evaluation) : null),
    [plot, grower, evaluation, property],
  );
  const draft: AgreementDraft | null = stored ?? generated;
  const pendingSections = draft
    ? SECTIONS.map((s) => ({ ...s, count: placeholderCount(draft.fields[s.id] ?? "") })).filter((s) => s.count > 0)
    : [];
  const confirmedShare = draft ? (SECTIONS.length - pendingSections.length) / SECTIONS.length : 0;

  function update(patch: Partial<AgreementDraft>) {
    if (!draft) return;
    saveAgreement({ ...draft, ...patch, updatedAt: new Date().toISOString() });
  }
  function setField(id: AgreementSectionId, value: string) {
    if (!draft) return;
    update({ fields: { ...draft.fields, [id]: value } });
  }
  function toggleFlag(id: AgreementSectionId) {
    if (!draft) return;
    update({ flagged: draft.flagged.includes(id) ? draft.flagged.filter((f) => f !== id) : [...draft.flagged, id] });
  }
  function download() {
    if (!draft || !grower) return;
    const blob = new Blob([agreementHtml(draft, property, grower)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acre-circle-draft-${property.id}-${grower.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Agreement drafts"
        description="Draft terms for each match, ready for professional review."
        actions={
          <Select aria-label="Property" value={property.id} onChange={(e) => setActiveProperty(e.target.value)} className="w-56">
            {state.properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        }
      />

      {plots.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-5 w-5" />}
          title="No provisional matches for this property"
          body="Drafts are created from the optimizer's current proposed plots. Under the current constraints no grower can be placed here."
          action={<ButtonLink href="/optimizer">Open the optimizer</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="no-print space-y-4 lg:sticky lg:top-[120px] lg:self-start">
            <Card className="p-4">
              <p className="px-1 text-[12px] font-medium text-muted">Provisional matches · {property.name}</p>
              <ul className="mt-2 space-y-1">
                {plots.map((p, i) => {
                  const g = growerById.get(p.growerId);
                  const d = state.agreements[agreementKey(property.id, p.growerId)];
                  return (
                    <li key={p.growerId}>
                      <button
                        type="button"
                        onClick={() => setSelected(p.growerId)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                          p.growerId === selectedId ? "bg-sage-soft" : "hover:bg-cream",
                        )}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif font-semibold text-paper"
                          style={{ background: PLOT_COLORS[i % PLOT_COLORS.length] }}
                        >
                          {p.plotId}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-forest">
                            {g?.label} · {g?.name}
                          </span>
                          <span className="block text-[12px] text-muted">
                            {p.acres.toFixed(2)} ac · {formatCurrency(p.monthlyRent)}/mo
                          </span>
                        </span>
                        {d?.status === "in-review" ? <Badge tone="info">Review</Badge> : d ? <Badge tone="gold">Edited</Badge> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {draft && (
              <Card className="p-4">
                <p className="flex items-center gap-2 text-[13px] font-medium text-warn">
                  <AlertTriangle className="h-4 w-4" /> Sections to confirm
                </p>
                <ul className="mt-2 space-y-0.5 text-[13px]">
                  {pendingSections.map((s) => (
                    <li key={s.id}>
                      <a href={`#section-${s.id}`} className="flex items-center justify-between rounded-lg px-1.5 py-1 text-ink/80 hover:bg-cream hover:text-forest">
                        {s.title}
                        <span className="text-[12px] text-muted tabular-nums">{s.count}</span>
                      </a>
                    </li>
                  ))}
                  {pendingSections.length === 0 && <li className="px-1.5 text-forest">Nothing left to confirm. Professional review still required.</li>}
                </ul>
                {draft.flagged.length > 0 && (
                  <p className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[13px] font-medium text-gold-deep">
                    <Flag className="h-4 w-4" /> {draft.flagged.length} flagged for discussion
                  </p>
                )}
              </Card>
            )}
          </aside>

          {draft && grower && plot && (
            <div className="min-w-0">
              <div className="no-print mb-4 flex flex-wrap items-center gap-2">
                <Badge tone={draft.status === "in-review" ? "info" : "gold"}>{draft.status === "in-review" ? "Ready for professional review" : "Draft"}</Badge>
                <div className="ml-auto flex flex-wrap gap-2">
                  {stored && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generated && saveAgreement({ ...generated, updatedAt: new Date().toISOString() })}
                      title="Regenerate from current match"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Regenerate
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={download} data-testid="download-agreement">
                    <Download className="h-3.5 w-3.5" /> Download HTML
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => window.print()}>
                    <Printer className="h-3.5 w-3.5" /> Print
                  </Button>
                  {draft.status === "draft" ? (
                    <Button size="sm" onClick={() => update({ status: "in-review" })}>
                      <Send className="h-3.5 w-3.5" /> Mark ready for review
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => update({ status: "draft" })}>
                      Back to draft
                    </Button>
                  )}
                </div>
              </div>

              <Card className="print-sheet overflow-hidden">
                <div
                  className="flex items-center justify-center gap-2 border-b-2 border-warn/40 bg-warn-soft px-4 py-3 text-center text-[12.5px] font-semibold tracking-[0.06em] text-warn"
                  data-testid="draft-banner"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {DRAFT_DISCLAIMER}
                </div>
                <div className="px-6 py-8 sm:px-10">
                  <h2 className="font-serif text-3xl text-forest">
                    {property.name} · Plot {plot.plotId}
                  </h2>
                  <p className="mt-1 text-sm text-muted">Draft micro-lease terms between the landowner and {grower.name}, from a provisional match on synthetic data. Not a lease; creates no obligations.</p>
                  <div className="no-print mt-5" data-testid="agreement-progress">
                    <div className="flex items-baseline justify-between text-[12.5px]">
                      <span className="text-ink/80">
                        {pendingSections.length === 0
                          ? "Every section is filled in"
                          : `${pendingSections.length} of ${SECTIONS.length} sections need confirmation`}
                      </span>
                      <span className="text-muted">Click any section to edit</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
                      <div className="h-full rounded-full bg-forest transition-[width] duration-500" style={{ width: `${Math.round(confirmedShare * 100)}%` }} />
                    </div>
                  </div>
                  <div className="mt-8 space-y-6">
                    {SECTIONS.map((s) => (
                      <DraftSection
                        key={`${selectedId}-${s.id}`}
                        id={s.id}
                        title={s.title}
                        value={draft.fields[s.id] ?? ""}
                        flagged={draft.flagged.includes(s.id)}
                        onChange={(v) => setField(s.id, v)}
                        onToggleFlag={() => toggleFlag(s.id)}
                      />
                    ))}
                  </div>
                  <p className="mt-10 border-t border-line pt-4 text-[12px] text-muted">
                    {DRAFT_DISCLAIMER} Acre Circle does not verify ownership, water, soil or legal compliance. Both parties should obtain independent professional advice.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
