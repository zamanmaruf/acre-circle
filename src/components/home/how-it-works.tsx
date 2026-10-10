"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useInView } from "motion/react";
import { ArrowRight, FileSignature, LayoutGrid, MapPinned, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { DURATION, EASE } from "@/lib/motion";

const STEPS = [
  {
    icon: <MapPinned className="h-5 w-5" />,
    title: "List your land",
    body: "Pin it on the map. Add size, water and access.",
    href: "/landowner",
    image: "/images/soil.jpg",
    alt: "Close-up of cultivated soil",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Growers request plots",
    body: "They find land that fits and ask in one step.",
    href: "/explore",
    image: "/images/seedlings.jpg",
    alt: "Hands planting seedlings",
  },
  {
    icon: <LayoutGrid className="h-5 w-5" />,
    title: "Plan the plots",
    body: "Acre Circle fits everyone in, with a reason for each spot.",
    href: "/optimizer",
    image: "/images/crop-rows.jpg",
    alt: "Rows of young crops",
  },
  {
    icon: <FileSignature className="h-5 w-5" />,
    title: "Agree and grow",
    body: "Draft lease terms, ready to review together.",
    href: "/agreements",
    image: "/images/market.jpg",
    alt: "Vegetables at a farmers' market",
  },
];

function Step({ index, active, onActive }: { index: number; active: boolean; onActive: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);
  const s = STEPS[index];
  return (
    <div ref={ref} className="flex items-center py-3 lg:min-h-[40vh] lg:py-6">
      <Link
        href={s.href}
        className={cn(
          "group block w-full rounded-3xl border p-7 transition-all duration-300",
          active ? "border-forest/20 bg-paper shadow-lift" : "border-transparent bg-transparent opacity-55 hover:opacity-80",
        )}
      >
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-300",
              active ? "bg-gold text-forest-deep" : "bg-forest text-paper",
            )}
          >
            {s.icon}
          </span>
          <span className="font-serif text-3xl text-line-strong">0{index + 1}</span>
        </div>
        <h3 className="mt-6 font-serif text-[28px] text-forest">{s.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
        <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-forest">
          Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
        <div className="relative mt-5 h-44 overflow-hidden rounded-2xl lg:hidden">
          <Image src={s.image} alt={s.alt} fill sizes="100vw" className="object-cover" />
        </div>
      </Link>
    </div>
  );
}

/** Scroll-linked stepper: the sticky visual follows whichever step is centred in the viewport. */
export function HowItWorksSteps() {
  const [active, setActive] = useState(0);
  const s = STEPS[active];
  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr]">
      <div className="hidden lg:block">
        <div className="sticky top-28 h-[52vh] overflow-hidden rounded-[32px] border border-line bg-forest-deep shadow-lift">
          <AnimatePresence initial={false}>
            <motion.div
              key={s.image}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.extraLong, ease: EASE.emphasizedDecelerate }}
            >
              <Image src={s.image} alt={s.alt} fill sizes="45vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/20 to-transparent" />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 p-8">
            <div className="mb-4 flex gap-1.5">
              {STEPS.map((x, i) => (
                <motion.span
                  key={x.title}
                  className="h-1 rounded-full bg-paper"
                  animate={{ width: i === active ? 40 : 12, opacity: i === active ? 1 : 0.4 }}
                  transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
                />
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={s.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: DURATION.medium, ease: EASE.emphasizedDecelerate }}
                className="font-serif text-3xl text-paper"
              >
                Step {active + 1}. {s.title}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div>
        {STEPS.map((x, i) => (
          <Step key={x.title} index={i} active={i === active} onActive={setActive} />
        ))}
      </div>
    </div>
  );
}
