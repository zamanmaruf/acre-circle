import { ACTIVITY_LABELS, FACILITY_LABELS, formatCurrency, SEASON_LABELS, WATER_LABELS, IRRIGATION_LABELS } from "./labels";
import type { AgreementDraft, AgreementSectionId, CandidateEvaluation, Grower, PlotAllocation, Property } from "./types";

export const DRAFT_DISCLAIMER = "DRAFT — FOR DISCUSSION AND PROFESSIONAL REVIEW. NOT LEGAL ADVICE.";

export const SECTIONS: { id: AgreementSectionId; title: string }[] = [
  { id: "parties", title: "1. Parties" },
  { id: "premises", title: "2. Proposed plot and property" },
  { id: "use", title: "3. Intended agricultural use" },
  { id: "term", title: "4. Proposed lease duration" },
  { id: "rent", title: "5. Proposed rent" },
  { id: "access", title: "6. Access arrangements" },
  { id: "water", title: "7. Water responsibilities" },
  { id: "equipment", title: "8. Equipment and shared facilities" },
  { id: "maintenance", title: "9. Maintenance responsibilities" },
  { id: "insurance", title: "10. Insurance and liability (for review)" },
  { id: "termination", title: "11. Termination considerations" },
  { id: "questions", title: "12. Unresolved questions" },
];

export const PLACEHOLDER = /\[TO CONFIRM[^\]]*\]/g;

export function agreementKey(propertyId: string, growerId: string) {
  return `${propertyId}:${growerId}`;
}

export function generateDraft(property: Property, grower: Grower, plot: PlotAllocation, evaluation: CandidateEvaluation): AgreementDraft {
  const warnings = evaluation.checks.filter((c) => c.status === "warn").map((c) => c.detail);
  const sharedFacilities = property.sharedFacilities.map((f) => FACILITY_LABELS[f].toLowerCase());
  const missingFacilities = grower.equipmentNeeds.filter((f) => !property.sharedFacilities.includes(f)).map((f) => FACILITY_LABELS[f].toLowerCase());

  const fields: Record<AgreementSectionId, string> = {
    parties: `Landowner: ${property.ownerName}, owner of ${property.name}. [TO CONFIRM: legal name and contact of landowner]\nGrower: ${grower.name} (${grower.label}${grower.kind === "nonprofit" ? ", nonprofit organization" : grower.kind === "group" ? ", grower group" : ""}). [TO CONFIRM: legal name and contact of grower]\nCoordinating organization (optional): [TO CONFIRM: name of land-access organization, if any]`,
    premises: `Plot ${plot.plotId}: approximately ${plot.acres.toFixed(2)} acres within ${property.name}, ${property.location}. Plot boundaries are based on a proposed allocation diagram and have not been surveyed. [TO CONFIRM: on-site boundary marking]\nOwnership and the right to lease have not been verified by Acre Circle. [TO CONFIRM: proof of ownership or authority to lease]`,
    use: `${grower.cropType}. Permitted activities: ${grower.activities.map((a) => ACTIVITY_LABELS[a].toLowerCase()).join(", ")}.\nNot permitted on this property: ${property.restrictions || "[TO CONFIRM: restrictions]"}`,
    term: `${SEASON_LABELS[grower.season]}. Proposed initial term: one growing season, with an option to renew by mutual agreement. [TO CONFIRM: start and end dates]`,
    rent: `${formatCurrency(plot.monthlyRent)} per month, based on the owner's stated rate of ${formatCurrency(property.rentPerAcreMonthly)} per acre per month for ${plot.acres.toFixed(2)} acres. Grower's stated budget: ${formatCurrency(grower.budgetMonthly)} per month. [TO CONFIRM: payment schedule and method]`,
    access: `${property.vehicleAccess ? "Vehicle access via the shared access lane (owner-reported)." : "Walk-in access only."} ${grower.needsVehicleAccess ? "Grower requires vehicle access." : ""} [TO CONFIRM: access hours, parking area and gate arrangements]`,
    water: `Property water status: ${WATER_LABELS[property.water]}. Irrigation: ${IRRIGATION_LABELS[property.irrigation]}. Grower requirement: ${grower.waterNeed === "none" ? "self-supplied water" : grower.waterNeed === "basic" ? "basic water access" : "verified irrigation capacity"}.\n${property.water === "verified" ? "" : "Water access must be independently confirmed before this draft progresses. "}[TO CONFIRM: who pays for water, who maintains hoses or lines, and seasonal shut-off]`,
    equipment: `Shared facilities listed by owner: ${sharedFacilities.length ? sharedFacilities.join(", ") : "none"}.${missingFacilities.length ? ` Grower has requested ${missingFacilities.join(", ")}, which is not currently listed. Needs discussion.` : ""} [TO CONFIRM: storage space allocation and responsibility for damage]`,
    maintenance: "Grower maintains their plot, keeps paths clear and removes waste at season end. Landowner maintains the shared yard and access lane. [TO CONFIRM: mowing, fencing and boundary maintenance]",
    insurance: "Both parties should seek advice on liability insurance, injury on the property and crop loss. Acre Circle does not provide insurance or legal advice. [TO CONFIRM: insurance requirements after professional review]",
    termination: "Proposed: either party may end the arrangement with 30 days' written notice, allowing the grower to harvest crops in the ground where practical. [TO CONFIRM: notice period, crop-removal rights and deposit, if any]",
    questions: [
      ...warnings.map((w) => `• ${w}`),
      !property.soilTested ? "• No laboratory soil test is on file." : "",
      "• Municipal, zoning or insurance requirements have not been reviewed.",
      "• Both parties should review this draft with an appropriate professional.",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  return {
    key: agreementKey(property.id, grower.id),
    propertyId: property.id,
    growerId: grower.id,
    status: "draft",
    fields,
    flagged: warnings.length ? ["water", "questions"] : ["questions"],
    updatedAt: "",
  };
}

export function missingItems(draft: AgreementDraft): { section: AgreementSectionId; text: string }[] {
  const out: { section: AgreementSectionId; text: string }[] = [];
  for (const s of SECTIONS) {
    const value = draft.fields[s.id] ?? "";
    if (!value.trim()) out.push({ section: s.id, text: `${s.title}: section is empty` });
    for (const m of value.matchAll(PLACEHOLDER)) {
      out.push({ section: s.id, text: m[0].replace(/^\[TO CONFIRM:?\s*/, "").replace(/\]$/, "") || "details" });
    }
  }
  return out;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function agreementHtml(draft: AgreementDraft, property: Property, grower: Grower): string {
  const sections = SECTIONS.map((s) => {
    const flagged = draft.flagged.includes(s.id);
    const body = escapeHtml(draft.fields[s.id] ?? "")
      .replace(PLACEHOLDER, (m) => `<mark>${m}</mark>`)
      .replace(/\n/g, "<br/>");
    return `<section${flagged ? ' class="flag"' : ""}><h2>${escapeHtml(s.title)}${flagged ? " <span>For discussion</span>" : ""}</h2><p>${body}</p></section>`;
  }).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Draft micro-lease — ${escapeHtml(property.name)} / ${escapeHtml(grower.name)}</title>
<style>body{font-family:Georgia,serif;max-width:760px;margin:40px auto;padding:0 24px;color:#11241b;line-height:1.55}
.banner{border:2px solid #a15c07;background:#fdf1d8;color:#7a4505;padding:12px 16px;font:600 13px/1.4 system-ui,sans-serif;letter-spacing:.04em;text-align:center}
h1{font-size:26px;margin:28px 0 4px;color:#073f2b}.meta{font:13px system-ui,sans-serif;color:#617269;margin-bottom:24px}
h2{font-size:16px;margin:22px 0 6px;color:#073f2b}h2 span{font:600 11px system-ui,sans-serif;background:#f6ead3;color:#9a6f2c;padding:2px 8px;border-radius:99px;margin-left:6px}
section.flag{border-left:3px solid #d8aa62;padding-left:12px}mark{background:#fdf1d8;color:#7a4505}
footer{margin-top:36px;font:12px system-ui,sans-serif;color:#617269;border-top:1px solid #e5e3d7;padding-top:12px}</style></head>
<body><div class="banner">${DRAFT_DISCLAIMER}</div>
<h1>Draft micro-lease terms</h1><div class="meta">${escapeHtml(property.name)} · ${escapeHtml(grower.name)} · Status: ${draft.status === "in-review" ? "Ready for professional review" : "Draft"} · Generated by the Acre Circle prototype from synthetic demonstration data.</div>
${sections}
<footer>${DRAFT_DISCLAIMER} This document is not a lease, has not been reviewed for legal compliance and creates no obligations. Highlighted items require confirmation.</footer></body></html>`;
}
