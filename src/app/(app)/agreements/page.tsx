"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Download, FileSignature, Flag, Printer, RotateCcw, Send, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PLOT_COLORS } from "@/components/plot-map";
import { Badge, Button, ButtonLink, Card, cn, EmptyState, Select, SyntheticBadge, Textarea } from "@/components/ui";
import { agreementHtml, agreementKey, DRAFT_DISCLAIMER, generateDraft, missingItems, SECTIONS } from "@/lib/agreement";
import { candidatesFor, runAllocation } from "@/lib/engine/allocate";
import { formatCurrency } from "@/lib/labels";
import { useDemoStore } from "@/lib/store";
import type { AgreementDraft, AgreementSectionId } from "@/lib/types";

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
  const missing = draft ? missingItems(draft) : [];

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
        eyebrow="Micro-lease workflow"
        title="Agreement drafts"
        description="Each provisional match gets a structured draft of terms, with every unverified item marked for confirmation. Edit, flag sections for discussion, then download or print for professional review."
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
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
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
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif font-semibold text-paper" style={{ background: PLOT_COLORS[i % PLOT_COLORS.length] }}>
                          {p.plotId}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium text-forest">{g?.label} · {g?.name}</span>
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
                  <AlertTriangle className="h-4 w-4" /> Missing information ({missing.length})
                </p>
                <ul className="mt-2 max-h-64 space-y-1.5 overflow-y-auto text-[12.5px] text-ink/80">
                  {missing.map((m, i) => (
                    <li key={i}>
                      <a href={`#section-${m.section}`} className="hover:text-forest hover:underline">
                        {m.text}
                      </a>
                    </li>
                  ))}
                  {missing.length === 0 && <li className="text-forest">No placeholders remain. Professional review still required.</li>}
                </ul>
                <p className="mt-3 flex items-center gap-2 text-[13px] font-medium text-gold-deep">
                  <Flag className="h-4 w-4" /> Flagged for discussion ({draft.flagged.length})
                </p>
              </Card>
            )}
          </aside>

          {draft && grower && plot && (
            <div className="min-w-0">
              <div className="no-print mb-4 flex flex-wrap items-center gap-2">
                <Badge tone={draft.status === "in-review" ? "info" : "gold"}>
                  {draft.status === "in-review" ? "Ready for professional review" : "Draft"}
                </Badge>
                <SyntheticBadge />
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
                <div className="flex items-center justify-center gap-2 border-b-2 border-warn/40 bg-warn-soft px-4 py-3 text-center text-[12.5px] font-semibold tracking-[0.06em] text-warn" data-testid="draft-banner">
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {DRAFT_DISCLAIMER}
                </div>
                <div className="px-6 py-8 sm:px-10">
                  <p className="text-[11.5px] font-semibold tracking-[0.16em] text-gold-deep uppercase">Draft micro-lease terms</p>
                  <h2 className="mt-2 font-serif text-3xl text-forest">
                    {property.name} · Plot {plot.plotId}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Between the landowner and {grower.name}. Generated from a provisional match on synthetic demonstration data. This is not a lease and creates no
                    obligations.
                  </p>
                  <div className="mt-8 space-y-6">
                    {SECTIONS.map((s) => {
                      const flagged = draft.flagged.includes(s.id);
                      const value = draft.fields[s.id] ?? "";
                      const hasPlaceholder = /\[TO CONFIRM/.test(value);
                      return (
                        <section key={s.id} id={`section-${s.id}`} className={cn("scroll-mt-32", flagged && "border-l-[3px] border-gold pl-4")}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-serif text-lg text-forest">{s.title}</h3>
                            <div className="flex items-center gap-2">
                              {hasPlaceholder && <Badge tone="warn">Needs confirmation</Badge>}
                              <button
                                type="button"
                                onClick={() => toggleFlag(s.id)}
                                aria-pressed={flagged}
                                className={cn(
                                  "no-print inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] transition-colors",
                                  flagged ? "border-gold bg-gold-soft text-gold-deep" : "border-line text-muted hover:border-gold hover:text-gold-deep",
                                )}
                              >
                                <Flag className="h-3 w-3" /> {flagged ? "For discussion" : "Mark for discussion"}
                              </button>
                            </div>
                          </div>
                          <Textarea
                            aria-label={s.title}
                            value={value}
                            onChange={(e) => setField(s.id, e.target.value)}
                            rows={Math.max(2, value.split("\n").length + 1)}
                            className="no-print mt-2 border-transparent bg-cream/50 text-[13.5px] hover:border-line-strong"
                          />
                          <p className="hidden whitespace-pre-line text-[13.5px] leading-relaxed print:block">{value}</p>
                        </section>
                      );
                    })}
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
