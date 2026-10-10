"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Bell, Building2, Check, LandPlot, Menu, RotateCcw, Search, Sprout, X } from "lucide-react";
import { openCommandPalette } from "./command-palette";
import { Logo } from "./logo";
import { Button, cn, Modal } from "./ui";
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

export function ResetDemoButton() {
  const { reset } = useDemoStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-1 underline-offset-2 hover:text-forest hover:underline">
        <RotateCcw className="h-3 w-3" /> Reset demo
      </button>
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
    </>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const role = useEffectiveRole();
  const [menu, setMenu] = useState(false);
  const nav = NAV[role];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md" style={{ viewTransitionName: "app-header" }}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-5 px-4 sm:px-6">
        <span className="flex items-center gap-2">
          <Logo />
          <span title="Synthetic demo data" className="hidden rounded-full border border-info/25 bg-info-soft px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-info uppercase sm:inline">
            Demo
          </span>
        </span>
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
          <NotificationBell />
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
    </header>
  );
}

const TOUR_DISMISSED_KEY = "acre-circle:tour-dismissed";
const TOUR_EVENT = "acre:tour-dismissed";

function subscribeTour(callback: () => void) {
  window.addEventListener(TOUR_EVENT, callback);
  return () => window.removeEventListener(TOUR_EVENT, callback);
}

/** Floating guided-demo pill. Desktop only; dismissal lasts for the browser session. */
export function DemoStepper() {
  const pathname = usePathname();
  const role = useEffectiveRole();
  const dismissed = useSyncExternalStore(
    subscribeTour,
    () => window.sessionStorage.getItem(TOUR_DISMISSED_KEY) === "1",
    () => true,
  );
  const setDismissed = () => {
    window.sessionStorage.setItem(TOUR_DISMISSED_KEY, "1");
    window.dispatchEvent(new Event(TOUR_EVENT));
  };
  const steps = DEMO_STEPS[role];
  const idx = steps.findIndex((s) => pathname.startsWith(s.href));
  const prev = steps[idx - 1];
  const next = steps[idx + 1];
  const visible = idx !== -1 && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          aria-label="Guided demo"
          data-testid="demo-stepper"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12, transition: { duration: DURATION.short } }}
          transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
          className="no-print fixed bottom-5 left-5 z-30 hidden items-center gap-1 rounded-full border border-white/10 bg-forest-deep py-1.5 pr-1.5 pl-4 text-paper shadow-lift lg:flex"
        >
          <span className="mr-1 text-[12px] text-paper/60">
            {role === "coordinator" ? "Guided demo" : role === "grower" ? "Grower path" : "Landowner path"}
          </span>
          <ol className="mr-1 flex items-center gap-1" aria-label="Steps">
            {steps.map((s, i) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  title={`${i + 1}. ${s.label}: ${s.caption}`}
                  aria-label={`Step ${i + 1}: ${s.label}`}
                  aria-current={i === idx ? "step" : undefined}
                  className="block p-1"
                >
                  <motion.span
                    className={cn("block h-1.5 rounded-full", i <= idx ? "bg-gold" : "bg-white/25")}
                    animate={{ width: i === idx ? 18 : 6 }}
                    transition={{ duration: DURATION.medium, ease: EASE.emphasizedDecelerate }}
                  />
                </Link>
              </li>
            ))}
          </ol>
          <span className="mr-1 text-[12.5px] font-medium whitespace-nowrap">
            {idx + 1}/{steps.length} · {steps[idx].label}
          </span>
          {prev && (
            <Link
              href={prev.href}
              transitionTypes={["nav-back"]}
              aria-label={`Back: ${prev.label}`}
              className="state-layer rounded-full p-1.5 text-paper/70 hover:text-paper"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          )}
          {next ? (
            <Link
              href={next.href}
              transitionTypes={["nav-forward"]}
              className="state-layer inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-[12.5px] font-medium whitespace-nowrap text-forest-deep"
            >
              Next: {next.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px]">
              <Check className="h-3.5 w-3.5 text-gold" /> Done
            </span>
          )}
          <button
            type="button"
            onClick={setDismissed}
            aria-label="Hide guided demo"
            className="state-layer ml-0.5 rounded-full p-1.5 text-paper/60 hover:text-paper"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 pb-5 md:flex-row md:items-end md:justify-between">
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.long, ease: EASE.emphasizedDecelerate }}
      >
        <h1 className="font-serif text-[28px] leading-[1.15] text-forest md:text-[32px]">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-muted">{description}</p>}
      </motion.div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
