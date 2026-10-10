"use client";

import { animate, motion, MotionConfig, useInView, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DURATION, EASE } from "@/lib/motion";

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Fades and rises content into place the first time it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
  id,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  id?: string;
  as?: "div" | "section" | "li";
}) {
  const Comp = motion[as];
  return (
    <Comp
      id={id}
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: DURATION.extraLong, ease: EASE.emphasizedDecelerate, delay }}
    >
      {children}
    </Comp>
  );
}

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const staggerChild = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.long, ease: EASE.emphasizedDecelerate } },
};

/** Container whose `StaggerItem` children enter one after another. */
export function Stagger({ children, className, inView = true }: { children: ReactNode; className?: string; inView?: boolean }) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      {...(inView ? { whileInView: "show", viewport: { once: true, margin: "0px 0px -8% 0px" } } : { animate: "show" })}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} variants={staggerChild} {...props}>
      {children}
    </motion.div>
  );
}

/**
 * Tweens a number from its previous value to the new one. Renders the final
 * value on the server and first paint, so text is never wrong while hidden.
 */
export function CountUp({
  value,
  format = (v) => String(Math.round(v)),
  duration = 0.6,
  fromZeroInView = false,
  className,
}: {
  value: number;
  format?: (v: number) => string;
  duration?: number;
  fromZeroInView?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true });
  const prev = useRef<number | null>(fromZeroInView ? 0 : null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (reduce || from === null || from === value || (fromZeroInView && !inView)) {
      if (fromZeroInView && !inView) prev.current = from;
      setShown(value);
      return;
    }
    const controls = animate(from, value, { duration, ease: EASE.emphasizedDecelerate, onUpdate: setShown });
    return () => controls.stop();
  }, [value, duration, reduce, inView, fromZeroInView]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {format(shown)}
    </span>
  );
}

/** Subtle press feedback for cards and tiles that act as buttons. */
export function PressScale({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }} transition={{ duration: DURATION.short, ease: EASE.standard }}>
      {children}
    </motion.div>
  );
}
