import { Suspense } from "react";
import type { Metadata } from "next";
import { LandownerView } from "./landowner-view";

export const metadata: Metadata = {
  title: "Landowners",
  description: "List land for shared micro-plots, drop an approximate pin, and see how many growers it could support.",
};

export default function LandownerPage() {
  return (
    <Suspense fallback={<div className="skeleton h-[480px] rounded-3xl" />}>
      <LandownerView />
    </Suspense>
  );
}
