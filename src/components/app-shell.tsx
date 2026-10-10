"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Bell, Building2, Check, LandPlot, Menu, RotateCcw, Search, Sprout, X } from "lucide-react";
import { openCommandPalette } from "./command-palette";
import { Logo } from "./logo";
import { Badge, Button, ButtonLink, cn, Modal } from "./ui";
import { useDemoStore } from "@/lib/store";
import { DURATION, EASE } from "@/lib/motion";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
}

const NAV: Record<Role, NavItem[]> = {
  coordinator: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/explore", label: "Explore Land" },
    { href: "/landowner", label: "Landowner" },
    { href: "/growers", label: "Growers" },
    { href: "/optimizer", label: "Plot Optimizer" },
    { href: "/agreements", label: "Agreements" },
  ],
  landowner: [
    { href: "/landowner", label: "My Land" },
    { href: "/inbox", label: "Inbox" },
    { href: "/growers", label: "Applicants" },
    { href: "/optimizer", label: "Plot Optimizer" },
    { href: "/agreements", label: "Agreements" },
  ],
  grower: [
    { href: "/explore", label: "Explore Land" },
    { href: "/requests", label: "My Requests" },
    { href: "/optimizer", label: "Plot Plan" },
    { href: "/agreements", label: "Agreements" },
  ],
};

export const ROLE_META: Record<Role, { label: string; short: string; home: string; icon: React.ReactNode }> = {
  grower: { label: "I want to grow", short: "Grower", home: "/explore", icon: <Sprout className="h-3.5 w-3.5" /> },
  landowner: { label: "I have land", short: "Landowner", home: "/landowner", icon: <LandPlot className="h-3.5 w-3.5" /> },
  coordinator: { label: "I run a program", short: "Program", home: "/dashboard", icon: <Building2 className="h-3.5 w-3.5" /> },
};

export const DEMO_STEPS: Record<Role, { href: string; label: string; caption: string }[]> = {
  coordinator: [
    { href: "/landowner", label: "Property", caption: "Review the listing" },
    { href: "/growers", label: "Growers", caption: "Five applicants" },
    { href: "/optimizer", label: "Optimize", caption: "Allocate plots" },
    { href: "/agreements", label: "Agreement", caption: "Draft for review" },
    { href: "/dashboard", label: "Dashboard", caption: "Organization view" },
  ],
  landowner: [
    { href: "/landowner", label: "My land", caption: "Your listing" },
    { href: "/inbox", label: "Inbox", caption: "Review requests" },
    { href: "/optimizer", label: "Optimize", caption: "Share the land" },
    { href: "/agreements", label: "Agreement", caption: "Draft terms" },
  ],
  grower: [
    { href: "/explore", label: "Find land", caption: "Map and listings" },
    { href: "/requests", label: "My requests", caption: "Track replies" },
    { href: "/optimizer", label: "Plot plan", caption: "See your plot" },
    { href: "/agreements", label: "Agreement", caption: "Review terms" },
  ],
};

export function useEffectiveRole(): Role {
  const { state } = useDemoStore();
  return state.role ?? "coordinator";
}

function RoleSwitcher({ compact }: { compact?: boolean }) {
  const { setRole } = useDemoStore();
  const role = useEffectiveRole();
  const router = useRouter();
  return (
    <div className="relative flex items-center rounded-full border border-line bg-cream p-0.5" role="radiogroup" aria-label="View as">
      {(Object.keys(ROLE_META) as Role[]).map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={role === r}
          title={ROLE_META[r].label}
          onClick={() => {
            setRole(r);
            router.push(ROLE_META[r].home);
          }}
          className={cn(
            "relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] transition-colors",
            role === r ? "text-paper" : "text-muted hover:text-forest",
          )}
        >
          {role === r && (
            <motion.span
              layoutId="role-pill"
              className="absolute inset-0 rounded-full bg-forest"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative">{ROLE_META[r].icon}</span>
          <span className={cn("relative", compact ? "sr-only" : "hidden xl:inline")}>{ROLE_META[r].short}</span>
        </button>
      ))}
    </div>
  );
}

function NotificationBell() {
  const { state, markNotificationsRead } = useDemoStore();
  const role = useEffectiveRole();
  const [open, setOpen] = useState(false);
  const [freshIds, setFreshIds] = useState<string[]>([]);
  const audience = role === "grower" ? "grower" : "landowner";
  const items = state.notifications.filter((n) => n.audience === audience && (audience === "landowner" || n.growerId === state.actingGrowerId));
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        className="state-layer relative rounded-full p-2 text-forest"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) setFreshIds(items.filter((n) => !n.read).map((n) => n.id));
          if (!open && unread) markNotificationsRead(audience);
        }}
        data-testid="notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key={unread}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.25, 1], opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
              className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10.5px] font-bold text-forest-deep"
            >
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, transition: { duration: DURATION.short } }}
              transition={{ duration: DURATION.medium, ease: EASE.emphasizedDecelerate }}
              className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-line bg-paper shadow-lift"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="border-b border-line px-4 py-3">
                <p className="text-[13px] font-medium text-forest">Notifications</p>
                <p className="text-[11.5px] text-muted">{audience === "grower" ? "Replies to your plot requests" : "Requests for your land"}</p>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {items.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-muted">Nothing new yet.</li>}
                {items.map((n) => (
                  <li key={n.id}>
                    <Link href={n.href} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-3 text-[13px] transition-colors hover:bg-cream">
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", !n.read || freshIds.includes(n.id) ? "bg-gold" : "bg-line-strong")} />
                      <span className="text-ink/85">{n.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const { reset } = useDemoStore();
  const role = useEffectiveRole();
  const [confirm, setConfirm] = useState(false);
  const [menu, setMenu] = useState(false);
  const nav = NAV[role];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md" style={{ viewTransitionName: "app-header" }}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-5 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="App">
          {nav.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn("relative rounded-full px-3 py-1.5 text-[13.5px] whitespace-nowrap transition-colors", active ? "text-paper" : "text-muted hover:bg-forest/5 hover:text-forest")}
              >
                {active && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
                )}
                <span className="relative">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={openCommandPalette}
            className="state-layer hidden items-center gap-2 rounded-full border border-line bg-cream px-3 py-1.5 text-[12.5px] text-muted sm:flex"
            aria-label="Open command palette"
            aria-keyshortcuts="Meta+K Control+K"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden 2xl:inline">Search</span>
            <kbd className="rounded border border-line bg-paper px-1 font-sans text-[10.5px]">⌘K</kbd>
          </button>
          <span className="hidden md:block">
            <RoleSwitcher />
          </span>
          <span className="hidden 2xl:block">
            <Badge tone="info">Demo mode · synthetic data</Badge>
          </span>
          <NotificationBell />
          <Button variant="ghost" size="sm" onClick={() => setConfirm(true)} title="Reset demo data">
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset demo</span>
          </Button>
          <button className="state-layer rounded-full p-2 text-forest lg:hidden" onClick={() => setMenu((m) => !m)} aria-label="Toggle menu" aria-expanded={menu}>
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {menu && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.medium, ease: EASE.standard }}
            className="overflow-hidden border-t border-line bg-paper lg:hidden"
            aria-label="App mobile"
          >
            <div className="space-y-3 px-4 py-3">
              <div className="flex items-center justify-between gap-2 md:hidden">
                <RoleSwitcher />
                <button
                  type="button"
                  onClick={() => {
                    setMenu(false);
                    openCommandPalette();
                  }}
                  className="state-layer flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted"
                >
                  <Search className="h-3.5 w-3.5" /> Search
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {nav.map((n) => (
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
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Reset demo data?" subtitle="Restores the synthetic listings, growers and requests, and clears saved results and agreement drafts.">
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
  const role = useEffectiveRole();
  const steps = DEMO_STEPS[role];
  const idx = steps.findIndex((s) => pathname.startsWith(s.href));
  if (idx === -1) return null;
  const prev = steps[idx - 1];
  const next = steps[idx + 1];
  const progress = (idx + 1) / steps.length;
  return (
    <div className="no-print relative border-b border-line bg-cream/80">
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] bg-gold"
        initial={false}
        animate={{ width: `${progress * 100}%` }}
        transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
      />
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 overflow-x-auto px-4 py-2.5 sm:px-6">
        <span className="hidden shrink-0 text-[11px] font-semibold tracking-[0.16em] text-gold-deep uppercase md:inline">
          {role === "coordinator" ? "Guided demo" : role === "grower" ? "Grower path" : "Landowner path"}
        </span>
        <ol className="flex items-center gap-1">
          {steps.map((s, i) => (
            <li key={s.href} className="flex items-center">
              <Link
                href={s.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2.5 py-1 text-[12.5px] transition-colors",
                  i === idx ? "bg-paper text-forest shadow-soft" : "text-muted hover:text-forest",
                )}
                title={s.caption}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-semibold transition-colors",
                    i < idx ? "bg-sage text-forest" : i === idx ? "bg-forest text-paper" : "border border-line-strong",
                  )}
                >
                  {i < idx ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </Link>
              {i < steps.length - 1 && <span className="mx-0.5 h-px w-3 bg-line-strong" />}
            </li>
          ))}
        </ol>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {prev && (
            <ButtonLink href={prev.href} variant="ghost" size="sm" transitionTypes={["nav-back"]}>
              <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{prev.label}</span>
            </ButtonLink>
          )}
          {next && (
            <ButtonLink href={next.href} variant="secondary" size="sm" transitionTypes={["nav-forward"]}>
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
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
      >
        {eyebrow && <p className="mb-2 text-[11.5px] font-semibold tracking-[0.18em] text-gold-deep uppercase">{eyebrow}</p>}
        <h1 className="font-serif text-[34px] leading-[1.1] text-forest md:text-[40px]">{title}</h1>
        {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
      </motion.div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
