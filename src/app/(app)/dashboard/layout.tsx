import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organization dashboard",
  description: "Listings, plot requests, provisional matches and readiness questions for a fictional Nova Scotia land-access cooperative.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
