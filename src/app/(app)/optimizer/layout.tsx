import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plot optimizer",
  description: "A deterministic constraint engine that screens applicants and proposes a shared micro-plot plan for one property.",
};

export default function OptimizerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
