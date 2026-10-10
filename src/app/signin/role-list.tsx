"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Building2, LandPlot, Sprout } from "lucide-react";
import { useDemoStore } from "@/lib/store";
import { DURATION, EASE } from "@/lib/motion";
import type { Role } from "@/lib/types";

const ROLES: { role: Role; href: string; icon: React.ReactNode; title: string; body: string; tag?: string }[] = [
  {
    role: "coordinator",
    href: "/dashboard",
    icon: <Building2 className="h-5 w-5" />,
    title: "Agricultural organization",
    body: "Coordinate listings, requests, plot plans and agreement drafts. The paying customer.",
    tag: "Recommended for judges",
  },
  {
    role: "landowner",
    href: "/landowner",
    icon: <LandPlot className="h-5 w-5" />,
    title: "Landowner",
    body: "List land, review plot requests and see how it could be shared.",
  },
  {
    role: "grower",
    href: "/explore",
    icon: <Sprout className="h-5 w-5" />,
    title: "Aspiring grower",
    body: "Find land on the map that fits your crops and budget, and request a plot.",
  },
];

export function SignInRoles() {
  const { setRole } = useDemoStore();
  return (
    <div className="mt-8 space-y-3">
      {ROLES.map((r, i) => (
        <motion.div
          key={r.href}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate, delay: 0.1 + i * 0.07 }}
        >
          <Link
            href={r.href}
            onClick={() => setRole(r.role)}
            className="group flex items-start gap-4 rounded-2xl border border-line bg-paper p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-forest/30 hover:shadow-lift active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest text-paper transition-colors group-hover:bg-gold group-hover:text-forest-deep">
              {r.icon}
            </span>
            <span className="flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-forest">{r.title}</span>
                {r.tag && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-gold-deep">{r.tag}</span>}
              </span>
              <span className="mt-1 block text-[13.5px] text-muted">{r.body}</span>
            </span>
            <ArrowRight className="mt-1 h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-forest" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
