"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Menu, RotateCcw, X } from "lucide-react";
import { Logo } from "./logo";
import { Badge, Button, ButtonLink, cn, Modal } from "./ui";
import { useDemoStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explore", label: "Explore Land" },
  { href: "/landowner", label: "Landowner" },
  { href: "/growers", label: "Growers" },
  { href: "/optimizer", label: "Plot Optimizer" },
  { href: "/agreements", label: "Agreements" },
];

export const DEMO_STEPS = [
  { href: "/landowner", label: "Property", caption: "Review the listing" },
  { href: "/growers", label: "Growers", caption: "Five applicants" },
  { href: "/optimizer", label: "Optimize", caption: "Allocate plots" },
  { href: "/agreements", label: "Agreement", caption: "Draft for review" },
  { href: "/dashboard", label: "Dashboard", caption: "Organization view" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { reset } = useDemoStore();
  const [confirm, setConfirm] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="App">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13.5px] transition-colors",
                pathname.startsWith(n.href) ? "bg-forest text-paper" : "text-muted hover:bg-forest/5 hover:text-forest",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:block">
            <Badge tone="info">Demo mode · synthetic data</Badge>
          </span>
          <Button variant="ghost" size="sm" onClick={() => setConfirm(true)} title="Reset demo data">
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset demo</span>
          </Button>
          <button className="rounded-full p-2 text-forest lg:hidden" onClick={() => setMenu((m) => !m)} aria-label="Toggle menu">
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menu && (
        <nav className="border-t border-line bg-paper px-4 py-3 lg:hidden" aria-label="App mobile">
          <div className="grid grid-cols-2 gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenu(false)}
                className={cn("rounded-xl px-3 py-2 text-sm", pathname.startsWith(n.href) ? "bg-forest text-paper" : "text-forest hover:bg-cream")}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset demo data?" subtitle="Restores Harbour Valley Farm, the five synthetic growers and clears saved results and agreement drafts.">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              reset();
              setConfirm(false);
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset demo data
          </Button>
        </div>
      </Modal>
    </header>
  );
}

export function DemoStepper() {
  const pathname = usePathname();
  const idx = DEMO_STEPS.findIndex((s) => pathname.startsWith(s.href));
  if (idx === -1) return null;
  const prev = DEMO_STEPS[idx - 1];
  const next = DEMO_STEPS[idx + 1];
  return (
    <div className="no-print border-b border-line bg-cream/80">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 overflow-x-auto px-4 py-2.5 sm:px-6">
        <span className="hidden shrink-0 text-[11px] font-semibold tracking-[0.16em] text-gold-deep uppercase md:inline">Guided demo</span>
        <ol className="flex items-center gap-1">
          {DEMO_STEPS.map((s, i) => (
            <li key={s.href} className="flex items-center">
              <Link
                href={s.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2.5 py-1 text-[12.5px] transition-colors",
                  i === idx ? "bg-paper text-forest shadow-soft" : "text-muted hover:text-forest",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-semibold",
                    i < idx ? "bg-sage text-forest" : i === idx ? "bg-forest text-paper" : "border border-line-strong",
                  )}
                >
                  {i < idx ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </Link>
              {i < DEMO_STEPS.length - 1 && <span className="mx-0.5 h-px w-3 bg-line-strong" />}
            </li>
          ))}
        </ol>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {prev && (
            <ButtonLink href={prev.href} variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{prev.label}</span>
            </ButtonLink>
          )}
          {next && (
            <ButtonLink href={next.href} variant="secondary" size="sm">
              Next: {next.label} <ArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-[11.5px] font-semibold tracking-[0.18em] text-gold-deep uppercase">{eyebrow}</p>}
        <h1 className="font-serif text-[34px] leading-[1.1] text-forest md:text-[40px]">{title}</h1>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
