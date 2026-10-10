"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DURATION, EASE } from "@/lib/motion";

export { cn };

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "light" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "state-layer press inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap select-none";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-forest text-paper hover:bg-forest-soft shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] hover:-translate-y-px",
  secondary: "border border-line-strong bg-paper text-forest hover:border-forest/40 hover:bg-white",
  ghost: "text-forest hover:bg-forest/5",
  gold: "bg-gold text-forest-deep hover:bg-[#e2b873] hover:-translate-y-px",
  light: "border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20",
  danger: "border border-danger/30 bg-paper text-danger hover:bg-danger-soft",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], extra);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

type Tone = "neutral" | "forest" | "sage" | "gold" | "warn" | "danger" | "info";
const toneClasses: Record<Tone, string> = {
  neutral: "bg-cream text-muted border-line",
  forest: "bg-forest text-paper border-forest",
  sage: "bg-sage-soft text-forest border-sage",
  gold: "bg-gold-soft text-gold-deep border-gold/40",
  warn: "bg-warn-soft text-warn border-warn/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  info: "bg-info-soft text-info border-info/25",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium leading-5 whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("rounded-2xl border border-line bg-paper shadow-soft", className)} {...props}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11.5px] font-semibold tracking-[0.18em] text-gold-deep uppercase", className)}>{children}</p>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-gold-deep">*</span>}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-line-strong bg-white px-3.5 text-sm text-ink placeholder:text-muted/60 transition-colors focus:border-forest focus:outline-none focus:ring-4 focus:ring-forest/10";

export function Input({ className, invalid, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input className={cn(inputBase, "h-10", invalid && "border-danger", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputBase, "min-h-[84px] py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(inputBase, "h-10 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23617269' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function ChipToggle({
  checked,
  onChange,
  children,
  tone = "forest",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  tone?: "forest" | "danger";
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "state-layer press inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-[color,background-color,border-color,transform]",
        checked
          ? tone === "forest"
            ? "border-forest bg-forest text-paper"
            : "border-danger bg-danger-soft text-danger"
          : "border-line-strong bg-white text-muted hover:border-forest/40 hover:text-forest",
      )}
    >
      {children}
    </button>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-forest" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-forest-deep/40 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.medium, ease: EASE.standard }}
          />
          <motion.div
            className={cn(
              "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-paper shadow-lift sm:rounded-3xl",
              wide ? "sm:max-w-4xl" : "sm:max-w-xl",
            )}
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: DURATION.short, ease: EASE.emphasizedAccelerate } }}
            transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div>
                <h2 className="font-serif text-2xl text-forest">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="state-layer rounded-full p-2 text-muted hover:text-forest" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4 shadow-soft">
      <div className="flex items-center justify-between text-[12.5px] text-muted">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 font-serif text-[28px] leading-none text-forest">{value}</div>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-paper/60 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-soft text-forest">{icon}</div>
      <h3 className="font-serif text-xl text-forest">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
