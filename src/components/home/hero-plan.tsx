"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CountUp } from "@/components/motion";
import { PlotMap } from "@/components/plot-map";
import { candidatesFor, runAllocation } from "@/lib/engine/allocate";
import { DURATION, EASE } from "@/lib/motion";
import { DEFAULT_PROPERTY_ID, SEED_GROWERS, SEED_PROPERTIES } from "@/lib/seed";
import type { Grower, Property } from "@/lib/types";

interface Frame {
  label: string;
  property: Property;
  growers: Grower[];
}

const base = SEED_PROPERTIES.find((p) => p.id === DEFAULT_PROPERTY_ID)!;
const withF = SEED_GROWERS.map((g) => (g.id === "grower-f" ? { ...g, interestedPropertyIds: [base.id] } : g));

const FRAMES: Frame[] = [
  { label: "Five applicants, 1.50 ac to share", property: base, growers: SEED_GROWERS },
  { label: "Owner accepts a sixth request", property: base, growers: withF },
  { label: "Owner keeps more land: 1.00 ac", property: { ...base, cultivableAcres: 1 }, growers: SEED_GROWERS },
];

/** Live engine output on synthetic data, cycling through what-if changes so the plan visibly reflows. */
export function HeroPlan() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const frames = useMemo(
    () => FRAMES.map((f) => ({ ...f, result: runAllocation(f.property, candidatesFor(f.property, f.growers)) })),
    [],
  );
  const frame = frames[i];

  useEffect(() => {
    if (reduce || paused) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % frames.length), 4200);
    return () => window.clearTimeout(t);
  }, [i, reduce, paused, frames.length]);

  return (
    <div className="rounded-[28px] border border-white/15 bg-paper/95 p-5 shadow-lift backdrop-blur" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-gold-deep uppercase">Live engine · synthetic data</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={frame.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: DURATION.medium, ease: EASE.emphasizedDecelerate }}
              className="font-serif text-xl text-forest"
            >
              {frame.label}
            </motion.p>
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="state-layer rounded-full p-2 text-forest"
          aria-label={paused ? "Play scenario cycle" : "Pause scenario cycle"}
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
      </div>
      <PlotMap property={frame.property} growers={withF} result={frame.result} compact />
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
        <div className="rounded-xl bg-cream px-2 py-2">
          <p className="font-serif text-lg text-forest">
            <CountUp value={frame.result.totals.allocatedAcres} format={(v) => `${v.toFixed(2)} ac`} />
          </p>
          <p className="text-muted">allocated</p>
        </div>
        <div className="rounded-xl bg-cream px-2 py-2">
          <p className="font-serif text-lg text-forest">
            <CountUp value={frame.result.plots.length} />
          </p>
          <p className="text-muted">growers placed</p>
        </div>
        <div className="rounded-xl bg-cream px-2 py-2">
          <p className="font-serif text-lg text-forest">{frame.property.reservedAcres.toFixed(2)} ac</p>
          <p className="text-muted">shared yard</p>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Scenarios">
        {frames.map((f, idx) => (
          <button
            key={f.label}
            type="button"
            role="tab"
            aria-selected={idx === i}
            aria-label={f.label}
            onClick={() => setI(idx)}
            className="group p-1"
          >
            <span className={`block h-1.5 rounded-full transition-all duration-300 ${idx === i ? "w-6 bg-forest" : "w-1.5 bg-line-strong group-hover:bg-muted"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
