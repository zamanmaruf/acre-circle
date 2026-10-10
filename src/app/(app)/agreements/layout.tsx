import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agreement drafts",
  description: "Draft micro-lease terms generated from a plot plan, for discussion and professional review. Not legal advice.",
};

export default function AgreementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
