import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Growers",
  description: "Synthetic grower profiles: crops, budgets, travel limits and the properties they're applying to.",
};

export default function GrowersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
