"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Building2, LandPlot, Sprout } from "lucide-react";
import { useDemoStore } from "@/lib/store";
import { DURATION, EASE } from "@/lib/motion";
import type { Role } from "@/lib/types";

export const ROLES: { role: Role; href: string; icon: React.ReactNode; title: string; body: string }[] = [
  {
    role: "grower",
    href: "/explore",
    icon: <Sprout className="h-5 w-5" />,
    title: "I want to grow",
    body: "Find a quarter-acre near you and request a plot.",
  },
  {
    role: "landowner",
    href: "/landowner",
    icon: <LandPlot className="h-5 w-5" />,
    title: "I have land",
    body: "Share part of your land and choose who grows on it.",
  },
  {
    role: "coordinator",
    href: "/dashboard",
    icon: <Building2 className="h-5 w-5" />,
    title: "I run a program",
    body: "Coordinate listings, applicants and plot plans.",
  },
];

export function RoleCards({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { setRole } = useDemoStore();
  return (
    <div className="grid gap-3 sm:grid-cols-3" data-testid="role-cards">
      {ROLES.map((r, i) => (
        <motion.div
          key={r.role}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.extraLong, ease: EASE.emphasizedDecelerate, delay: 0.25 + i * 0.08 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href={r.href}
            onClick={() => setRole(r.role)}
            className={
              tone === "dark"
                ? "group flex h-full flex-col rounded-2xl border border-white/15 bg-white/[0.08] p-4 text-paper backdrop-blur-md transition-colors hover:border-gold/60 hover:bg-white/[0.14]"
                : "group flex h-full flex-col rounded-2xl border border-line bg-paper p-4 text-forest shadow-soft transition-colors hover:border-forest/30"
            }
          >
            <span className="flex items-center justify-between">
              <span
                className={
                  tone === "dark"
                    ? "flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-forest-deep"
                    : "flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-paper"
                }
              >
                {r.icon}
              </span>
              <ArrowRight className="h-4 w-4 opacity-60 transition-transform duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
            </span>
            <span className="mt-4 font-serif text-[21px] leading-tight">{r.title}</span>
            <span className={tone === "dark" ? "mt-1 text-[13px] leading-snug text-paper/70" : "mt-1 text-[13px] leading-snug text-muted"}>{r.body}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
