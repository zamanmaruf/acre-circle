"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import type { AllocationResult, Grower, Property } from "@/lib/types";
import { FACILITY_LABELS, formatCurrency } from "@/lib/labels";
import { cn } from "./ui";

export const PLOT_COLORS = ["#0F5A3E", "#7FA874", "#D8AA62", "#3F7F7A", "#B9785A", "#6E7FA8", "#9A8A5A", "#5B8C6E"];
const DARK_TEXT = new Set(["#7FA874", "#D8AA62", "#9A8A5A"]);

const W = 960;
const H = 560;
const PAD = 20;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Item {
  id: string;
  kind: "plot" | "unallocated" | "other";
  acres: number;
}

/** Order-preserving binary treemap: area of each rect is proportional to its weight. */
function treemap(items: Item[], rect: Rect): Map<string, Rect> {
  const out = new Map<string, Rect>();
  const visit = (list: Item[], r: Rect) => {
    if (list.length === 0) return;
    if (list.length === 1) {
      out.set(list[0].id, r);
      return;
    }
    const total = list.reduce((s, i) => s + i.acres, 0);
    let acc = 0;
    let split = 1;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let k = 1; k < list.length; k++) {
      acc += list[k - 1].acres;
      const diff = Math.abs(total / 2 - acc);
      if (diff < bestDiff) {
        bestDiff = diff;
        split = k;
      }
    }
    const left = list.slice(0, split);
    const right = list.slice(split);
    const frac = total > 0 ? left.reduce((s, i) => s + i.acres, 0) / total : 0.5;
    if (r.w >= r.h) {
      const w1 = r.w * frac;
      visit(left, { x: r.x, y: r.y, w: w1, h: r.h });
      visit(right, { x: r.x + w1, y: r.y, w: r.w - w1, h: r.h });
    } else {
      const h1 = r.h * frac;
      visit(left, { x: r.x, y: r.y, w: r.w, h: h1 });
      visit(right, { x: r.x, y: r.y + h1, w: r.w, h: r.h - h1 });
    }
  };
  visit(items, rect);
  return out;
}

export interface PlotMapProps {
  property: Property;
  growers: Grower[];
  result: AllocationResult | null;
  stale?: boolean;
  className?: string;
}

export function PlotMap({ property, growers, result, stale, className }: PlotMapProps) {
  const [hover, setHover] = useState<string | null>(null);
  const growerById = useMemo(() => new Map(growers.map((g) => [g.id, g])), [growers]);

  const layout = useMemo(() => {
    const total = Math.max(property.totalAcres, 0.01);
    const reserved = Math.min(property.reservedAcres, total);
    const area = W * H;
    const r = reserved / total;
    let laneH = 34;
    let sharedW = 0;
    if (r <= 0) {
      laneH = 0;
    } else if (r * area < W * laneH * 1.4) {
      laneH = (r * area) / W;
    } else {
      sharedW = (r * area - W * laneH) / (H - laneH);
    }
    const field: Rect = { x: sharedW, y: 0, w: W - sharedW, h: H - laneH };

    const cultivable = result?.valid ? result.totals.cultivableAcres : Math.min(property.cultivableAcres, total - reserved);
    const plots = result?.valid ? result.plots : [];
    const allocated = plots.reduce((s, p) => s + p.acres, 0);
    const items: Item[] = [
      ...plots.map<Item>((p) => ({ id: p.growerId, kind: "plot", acres: p.acres })),
      { id: "__unallocated", kind: "unallocated" as const, acres: Math.max(0, cultivable - allocated) },
      { id: "__other", kind: "other" as const, acres: Math.max(0, total - reserved - cultivable) },
    ].filter((i) => i.acres > 0.0001);
    const rects = treemap(items, field);
    return { sharedW, laneH, field, rects, items, plots };
  }, [property, result]);

  const colorFor = (growerId: string) => {
    const idx = layout.plots.findIndex((p) => p.growerId === growerId);
    return PLOT_COLORS[idx % PLOT_COLORS.length];
  };

  const hovered = hover ? layout.items.find((i) => i.id === hover) : null;
  const hoveredRect = hover ? layout.rects.get(hover) : null;
  const hoveredPlot = hover ? layout.plots.find((p) => p.growerId === hover) : null;
  const hoveredGrower = hoveredPlot ? growerById.get(hoveredPlot.growerId) : null;
  const hoveredEval = hoveredPlot ? result?.evaluations.find((e) => e.growerId === hoveredPlot.growerId) : null;

  const boundary = `M ${PAD + 6} ${PAD + 10} L ${PAD + W - 8} ${PAD} L ${PAD + W} ${PAD + H - 6} L ${PAD + 4} ${PAD + H} Z`;

  return (
    <div className={cn("relative", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-[#F3F1E6]">
        <svg viewBox={`0 0 ${W + PAD * 2} ${H + PAD * 2}`} className="block h-auto w-full" role="img" aria-label={`Proposed allocation diagram for ${property.name}`}>
          <defs>
            <clipPath id="boundary-clip">
              <path d={boundary} />
            </clipPath>
            <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="10" height="10" fill="#F8F7F0" />
              <line x1="0" y1="0" x2="0" y2="10" stroke="#C9CDBF" strokeWidth="3" />
            </pattern>
            <pattern id="other" width="14" height="14" patternUnits="userSpaceOnUse">
              <rect width="14" height="14" fill="#E9E6D9" />
              <circle cx="3" cy="3" r="1.2" fill="#C2BFAE" />
              <circle cx="10" cy="10" r="1.2" fill="#C2BFAE" />
            </pattern>
            <pattern id="furrows" width="12" height="12" patternUnits="userSpaceOnUse">
              <line x1="0" y1="6" x2="12" y2="6" stroke="white" strokeOpacity="0.09" strokeWidth="2" />
            </pattern>
            <pattern id="gravel" width="8" height="8" patternUnits="userSpaceOnUse">
              <rect width="8" height="8" fill="#E3DAC4" />
              <circle cx="2" cy="2" r="0.9" fill="#CBBF9F" />
              <circle cx="6" cy="5" r="0.9" fill="#CBBF9F" />
            </pattern>
          </defs>

          <g clipPath="url(#boundary-clip)">
            <g transform={`translate(${PAD} ${PAD})`}>
              {layout.sharedW > 0 && (
                <g>
                  <rect x={0} y={0} width={layout.sharedW} height={H} fill="#EFE7D3" />
                  <g transform={`translate(${layout.sharedW / 2} ${H * 0.36})`} textAnchor="middle">
                    <rect x={-26} y={-26} width={52} height={36} rx={4} fill="#C9B68C" />
                    <path d="M -32 -24 L 0 -44 L 32 -24 Z" fill="#9A6F2C" />
                    <text y={30} fontSize="15" fontWeight="600" fill="#5B4A26">Shared yard</text>
                    <text y={50} fontSize="12" fill="#7A6A44">
                      {property.sharedFacilities.slice(0, 2).map((f) => FACILITY_LABELS[f]).join(" · ") || "No facilities listed"}
                    </text>
                  </g>
                </g>
              )}
              {layout.laneH > 0 && (
                <g>
                  <rect x={layout.sharedW > 0 ? layout.sharedW : 0} y={H - layout.laneH} width={W} height={layout.laneH} fill="url(#gravel)" />
                  <line x1={layout.sharedW} y1={H - layout.laneH / 2} x2={W} y2={H - layout.laneH / 2} stroke="#B8A57B" strokeDasharray="10 8" strokeWidth="2" />
                  {layout.laneH > 16 && (
                    <text x={layout.sharedW + 16} y={H - layout.laneH / 2 + 4} fontSize="12" fill="#6F5E38" fontWeight="500">
                      {property.vehicleAccess ? "Vehicle access lane (schematic)" : "Walk-in access path (schematic)"}
                    </text>
                  )}
                </g>
              )}

              {layout.items.map((item, idx) => {
                const r = layout.rects.get(item.id)!;
                const inset = 3;
                const fill =
                  item.kind === "plot" ? colorFor(item.id) : item.kind === "unallocated" ? "url(#hatch)" : "url(#other)";
                const dim = hover && hover !== item.id;
                return (
                  <motion.g
                    key={item.id}
                    onMouseEnter={() => setHover(item.id)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(item.id)}
                    onBlur={() => setHover(null)}
                    tabIndex={0}
                    style={{ cursor: "default", outline: "none" }}
                    animate={{ opacity: dim ? 0.55 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.rect
                      initial={{ x: r.x + r.w / 2, y: r.y + r.h / 2, width: 0, height: 0 }}
                      animate={{ x: r.x + inset, y: r.y + inset, width: Math.max(0, r.w - inset * 2), height: Math.max(0, r.h - inset * 2) }}
                      transition={{ type: "spring", stiffness: 140, damping: 22, delay: item.kind === "plot" ? idx * 0.08 : 0 }}
                      rx={10}
                      fill={fill}
                      stroke={hover === item.id ? "#04291E" : "rgba(4,41,30,0.15)"}
                      strokeWidth={hover === item.id ? 2.5 : 1}
                    />
                    {item.kind === "plot" && (
                      <motion.rect
                        initial={{ x: r.x + r.w / 2, y: r.y + r.h / 2, width: 0, height: 0 }}
                        animate={{ x: r.x + inset, y: r.y + inset, width: Math.max(0, r.w - inset * 2), height: Math.max(0, r.h - inset * 2) }}
                        transition={{ type: "spring", stiffness: 140, damping: 22, delay: idx * 0.08 }}
                        rx={10}
                        fill="url(#furrows)"
                        pointerEvents="none"
                      />
                    )}
                    <PlotLabel item={item} rect={r} plot={layout.plots.find((p) => p.growerId === item.id)} grower={growerById.get(item.id)} color={item.kind === "plot" ? colorFor(item.id) : undefined} delay={idx * 0.08} />
                  </motion.g>
                );
              })}
            </g>
          </g>
          <path d={boundary} fill="none" stroke="#04291E" strokeWidth="2.5" strokeDasharray="2 0" />
          <g transform={`translate(${PAD + 14} ${PAD + H - 4})`}>
            <rect x={-6} y={-18} width={44} height={22} rx={4} fill="#04291E" />
            <text x={16} y={-3} fontSize="11" fill="#FEFDF9" textAnchor="middle" fontWeight="600">GATE</text>
          </g>
          <g transform={`translate(${PAD + W - 30} ${PAD + 40})`}>
            <circle r="16" fill="#FEFDF9" stroke="#04291E" strokeOpacity="0.3" />
            <path d="M 0 -11 L 5 4 L 0 1 L -5 4 Z" fill="#04291E" />
            <text y="13" fontSize="8" textAnchor="middle" fill="#04291E" fontWeight="700">N</text>
          </g>
        </svg>

        {stale && (
          <div className="absolute inset-x-0 top-0 flex justify-center p-3">
            <span className="rounded-full border border-warn/30 bg-warn-soft px-3 py-1 text-xs font-medium text-warn shadow-soft">
              Inputs changed. Recalculate to update this diagram.
            </span>
          </div>
        )}

        {hovered && hoveredRect && (
          <div
            className="pointer-events-none absolute z-10 w-64 -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-paper/95 p-3 text-xs shadow-lift backdrop-blur"
            style={{
              left: `${((hoveredRect.x + PAD + hoveredRect.w / 2) / (W + PAD * 2)) * 100}%`,
              top: `${((hoveredRect.y + PAD + Math.min(hoveredRect.h / 2, 60)) / (H + PAD * 2)) * 100}%`,
            }}
          >
            {hoveredPlot && hoveredGrower ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(hoveredPlot.growerId) }} />
                  <span className="font-semibold text-forest">
                    Plot {hoveredPlot.plotId} · {hoveredGrower.label}
                  </span>
                </div>
                <p className="mt-1 text-muted">{hoveredGrower.name} — {hoveredGrower.cropType}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  <dt className="text-muted">Area</dt>
                  <dd className="text-right font-medium">{hoveredPlot.acres.toFixed(2)} ac</dd>
                  <dt className="text-muted">Requested</dt>
                  <dd className="text-right">{hoveredGrower.desiredAcres.toFixed(2)} ac</dd>
                  <dt className="text-muted">Proposed rent</dt>
                  <dd className="text-right">{formatCurrency(hoveredPlot.monthlyRent)}/mo</dd>
                </dl>
                {hoveredEval && hoveredEval.checks.some((c) => c.status === "warn") && (
                  <p className="mt-2 rounded-lg bg-warn-soft px-2 py-1.5 text-warn">
                    {hoveredEval.checks.filter((c) => c.status === "warn").length} item(s) to confirm before agreement
                  </p>
                )}
              </>
            ) : hovered.kind === "unallocated" ? (
              <p>
                <span className="font-semibold text-forest">{hovered.acres.toFixed(2)} ac unallocated</span>
                <br />
                <span className="text-muted">Cultivable area not assigned under current constraints.</span>
              </p>
            ) : (
              <p>
                <span className="font-semibold text-forest">{hovered.acres.toFixed(2)} ac not offered</span>
                <br />
                <span className="text-muted">Part of the property the owner has not listed as cultivable.</span>
              </p>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-[11.5px] text-muted">
        Proposed allocation diagram. Areas are drawn to scale relative to each other; shapes and positions are schematic, not a surveyed property boundary.
      </p>
    </div>
  );
}

function PlotLabel({
  item,
  rect,
  plot,
  grower,
  color,
  delay,
}: {
  item: Item;
  rect: Rect;
  plot?: { plotId: string; acres: number };
  grower?: Grower;
  color?: string;
  delay: number;
}) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const small = rect.w < 130 || rect.h < 90;
  const textColor = color && !DARK_TEXT.has(color) ? "#FEFDF9" : "#04291E";
  if (item.kind !== "plot") {
    if (rect.w < 90 || rect.h < 40) return null;
    return (
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1, x: cx, y: cy }} transition={{ duration: 0.4 }} pointerEvents="none" textAnchor="middle">
        <text fontSize="13" fontWeight="600" fill="#617269" y={-2}>
          {item.kind === "unallocated" ? "Unallocated" : "Not offered"}
        </text>
        <text fontSize="12" fill="#617269" y={16}>
          {item.acres.toFixed(2)} ac
        </text>
      </motion.g>
    );
  }
  return (
    <motion.g
      initial={{ opacity: 0, x: cx, y: cy }}
      animate={{ opacity: 1, x: cx, y: cy }}
      transition={{ duration: 0.4, delay: 0.25 + delay }}
      pointerEvents="none"
      textAnchor="middle"
      fill={textColor}
    >
      {small ? (
        <>
          <text fontSize="20" fontWeight="700" y={2}>
            {plot?.plotId}
          </text>
          <text fontSize="11.5" y={20} opacity={0.9}>
            {plot?.acres.toFixed(2)} ac
          </text>
        </>
      ) : (
        <>
          <text fontSize="13" fontWeight="600" y={-28} opacity={0.85} letterSpacing="1.5">
            PLOT {plot?.plotId}
          </text>
          <text fontSize="19" fontWeight="600" y={-4} fontFamily="var(--font-serif)">
            {grower?.label}
          </text>
          <text fontSize="12.5" y={16} opacity={0.9}>
            {grower?.cropType && grower.cropType.length > 26 ? `${grower.cropType.slice(0, 24)}…` : grower?.cropType}
          </text>
          <text fontSize="14" fontWeight="600" y={40}>
            {plot?.acres.toFixed(2)} ac
          </text>
        </>
      )}
    </motion.g>
  );
}

export function PlotLegend({ result, growers, property }: { result: AllocationResult | null; growers: Grower[]; property: Property }) {
  const byId = new Map(growers.map((g) => [g.id, g]));
  const plots = result?.valid ? result.plots : [];
  return (
    <ul className="grid gap-2 text-[13px] sm:grid-cols-2">
      {plots.map((p, i) => {
        const g = byId.get(p.growerId);
        return (
          <li key={p.growerId} className="flex items-center gap-2.5">
            <span className="h-3 w-3 shrink-0 rounded" style={{ background: PLOT_COLORS[i % PLOT_COLORS.length] }} />
            <span className="truncate">
              <span className="font-medium text-forest">Plot {p.plotId}</span> · {g?.label} · {p.acres.toFixed(2)} ac
            </span>
          </li>
        );
      })}
      {property.reservedAcres > 0 && (
        <li className="flex items-center gap-2.5">
          <span className="h-3 w-3 shrink-0 rounded bg-[#EFE7D3] ring-1 ring-[#C9B68C]" />
          <span>Shared yard &amp; access · {property.reservedAcres.toFixed(2)} ac</span>
        </li>
      )}
      {result?.valid && result.totals.unallocatedAcres > 0 && (
        <li className="flex items-center gap-2.5">
          <span className="hatch h-3 w-3 shrink-0 rounded ring-1 ring-line-strong" />
          <span>Unallocated · {result.totals.unallocatedAcres.toFixed(2)} ac</span>
        </li>
      )}
      {result?.valid && result.totals.otherAcres > 0 && (
        <li className="flex items-center gap-2.5">
          <span className="h-3 w-3 shrink-0 rounded bg-[#E9E6D9] ring-1 ring-line-strong" />
          <span>Not offered for cultivation · {result.totals.otherAcres.toFixed(2)} ac</span>
        </li>
      )}
    </ul>
  );
}
