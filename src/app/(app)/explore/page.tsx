import { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreView } from "./explore-view";

export const metadata: Metadata = {
  title: "Explore land",
  description: "Map of fictional Nova Scotia listings open to shared micro-plots, with fit checks and plot requests.",
};

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="skeleton h-[640px] rounded-3xl" />}>
      <ExploreView />
    </Suspense>
  );
}
