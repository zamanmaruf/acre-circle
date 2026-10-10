"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { ROLES } from "@/components/home/role-cards";
import { useDemoStore } from "@/lib/store";
import { DURATION, EASE } from "@/lib/motion";

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
            className="group flex items-center gap-4 rounded-2xl border border-line bg-paper p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-forest/30 hover:shadow-lift active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest text-paper transition-colors group-hover:bg-gold group-hover:text-forest-deep">
              {r.icon}
            </span>
            <span className="flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-serif text-[19px] text-forest">{r.title}</span>
                {r.role === "coordinator" && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-gold-deep">Full walkthrough</span>}
              </span>
              <span className="block text-[13px] text-muted">{r.body}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-forest" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
