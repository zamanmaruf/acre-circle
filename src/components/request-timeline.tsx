"use client";

import { Check, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "./ui";
import { DURATION, EASE } from "@/lib/motion";
import type { PlotRequest } from "@/lib/types";

const DATE_FORMAT = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "America/Halifax" });

export function formatRequestDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

/** Sent, viewed by owner, then accepted or declined. */
export function RequestTimeline({ request }: { request: PlotRequest }) {
  const reached = request.status === "sent" ? 0 : request.status === "viewed" ? 1 : 2;
  const declined = request.status === "declined";
  const steps = [
    { label: "Sent", date: formatRequestDate(request.createdAt) },
    { label: "Viewed by owner", date: reached >= 1 && request.status === "viewed" ? formatRequestDate(request.updatedAt) : null },
    {
      label: declined ? "Declined" : request.status === "accepted" ? "Accepted" : "Owner decision",
      date: reached === 2 ? formatRequestDate(request.updatedAt) : null,
    },
  ];
  return (
    <div className="relative">
      <div className="absolute top-3 right-[16.7%] left-[16.7%] h-0.5 rounded-full bg-line" aria-hidden />
      <motion.div
        aria-hidden
        className={cn("absolute top-3 left-[16.7%] h-0.5 rounded-full", declined ? "bg-danger" : "bg-forest")}
        initial={{ width: 0 }}
        animate={{ width: `${(reached / 2) * 66.6}%` }}
        transition={{ duration: DURATION.extraLong, ease: EASE.emphasizedDecelerate }}
      />
      <ol className="relative grid grid-cols-3" aria-label={`Request status: ${steps[reached].label}`}>
        {steps.map((s, i) => {
          const done = i <= reached;
          const isLast = i === 2 && reached === 2;
          return (
            <li key={s.label} className="relative flex flex-col items-center text-center" aria-current={i === reached ? "step" : undefined}>
              <motion.span
                initial={false}
                animate={{ scale: i === reached ? 1.08 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className={cn(
                  "relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-semibold",
                  done
                    ? isLast && declined
                      ? "border-danger bg-danger text-paper"
                      : "border-forest bg-forest text-paper"
                    : "border-line-strong bg-paper text-muted",
                )}
              >
                {isLast && declined ? <X className="h-3.5 w-3.5" /> : done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </motion.span>
              <span className={cn("mt-1.5 text-[12px] font-medium", done ? "text-ink" : "text-muted")}>{s.label}</span>
              <span className="text-[11px] text-muted">{s.date ?? (i > reached ? "Waiting" : "")}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
