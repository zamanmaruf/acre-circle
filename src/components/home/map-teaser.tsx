"use client";

import { useInView } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { LandMap } from "@/components/land-map";
import { useDemoStore } from "@/lib/store";

/** Mounts the real map only once the section scrolls near the viewport, so the homepage stays light. */
export function MapTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: "300px 0px" });
  const { state, setActiveProperty } = useDemoStore();
  const router = useRouter();
  return (
    <div ref={ref} className="relative h-[440px] overflow-hidden rounded-[28px] border border-line shadow-lift sm:h-[520px]">
      {near ? (
        <LandMap
          properties={state.properties}
          className="absolute inset-0"
          onSelect={(id) => {
            setActiveProperty(id);
            router.push(`/explore?property=${id}`);
          }}
        />
      ) : (
        <div className="skeleton absolute inset-0" />
      )}
    </div>
  );
}
