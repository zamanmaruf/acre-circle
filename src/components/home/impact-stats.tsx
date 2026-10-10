"use client";

import { CountUp, Stagger, StaggerItem } from "@/components/motion";

const STATS = [
  { value: 2741, format: (v: number) => Math.round(v).toLocaleString("en-CA"), label: "census farms in Nova Scotia in 2021" },
  {
    value: -21.2,
    format: (v: number) => `${v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`,
    label: "change in census farm count, 2016 to 2021: the largest decline of any province",
  },
  { value: 58.2, format: (v: number) => v.toFixed(1), label: "average farm operator age in 2021, the highest in Canada" },
];

export function ImpactStats() {
  return (
    <Stagger className="mt-14 grid gap-5 md:grid-cols-3">
      {STATS.map((s) => (
        <StaggerItem key={s.label} className="rounded-3xl border border-line bg-paper p-8 shadow-soft">
          <p className="font-serif text-6xl text-forest">
            <CountUp value={s.value} format={s.format} duration={1.4} fromZeroInView />
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{s.label}</p>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
