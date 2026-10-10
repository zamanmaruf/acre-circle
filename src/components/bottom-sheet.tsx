"use client";

import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SPRING } from "@/lib/motion";

/**
 * Draggable sheet that rests at fractional snap points of its container's
 * height (e.g. 0.25 = a quarter visible). Must sit inside a positioned parent.
 */
export function BottomSheet({
  children,
  snaps = [0.25, 0.6, 0.95],
  snap,
  onSnapChange,
  label,
}: {
  children: ReactNode;
  snaps?: number[];
  snap: number;
  onSnapChange: (index: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const y = useMotionValue(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => setHeight(parent.clientHeight));
    ro.observe(parent);
    setHeight(parent.clientHeight);
    return () => ro.disconnect();
  }, []);

  const offsetFor = (i: number) => height * (1 - snaps[i]);

  useEffect(() => {
    if (!height) return;
    const controls = animate(y, offsetFor(snap), reduce ? { duration: 0 } : SPRING.sheet);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- offsetFor derives from height and snaps
  }, [snap, height, reduce]);

  function onDragEnd(_: unknown, info: PanInfo) {
    const projected = y.get() + info.velocity.y * 0.2;
    let best = 0;
    snaps.forEach((_, i) => {
      if (Math.abs(offsetFor(i) - projected) < Math.abs(offsetFor(best) - projected)) best = i;
    });
    onSnapChange(best);
    animate(y, offsetFor(best), reduce ? { duration: 0 } : SPRING.sheet);
  }

  return (
    <motion.div
      ref={ref}
      className="absolute inset-x-0 top-0 z-20 flex flex-col rounded-t-[28px] border border-line bg-paper shadow-[0_-12px_40px_-16px_rgba(4,41,30,0.35)]"
      style={{ y, height: height ? height : "100%", visibility: height ? "visible" : "hidden" }}
      drag="y"
      dragConstraints={{ top: offsetFor(snaps.length - 1), bottom: offsetFor(0) }}
      dragElastic={0.08}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      role="region"
      aria-label={label}
    >
      <button
        type="button"
        className="flex w-full shrink-0 cursor-grab justify-center pt-2.5 pb-2 active:cursor-grabbing"
        aria-label={snap === snaps.length - 1 ? "Collapse panel" : "Expand panel"}
        onClick={() => onSnapChange(snap === snaps.length - 1 ? 0 : snaps.length - 1)}
      >
        <span className="h-1.5 w-10 rounded-full bg-line-strong" />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6" onPointerDownCapture={(e) => e.stopPropagation()}>
        {children}
      </div>
    </motion.div>
  );
}
