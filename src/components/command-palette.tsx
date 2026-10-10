"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  CornerDownLeft,
  FileSignature,
  Home,
  Inbox,
  LandPlot,
  LayoutDashboard,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  Search,
  Send,
  Sprout,
  Users,
} from "lucide-react";
import { useToast } from "./toast";
import { cn } from "./ui";
import { DURATION, EASE } from "@/lib/motion";
import { useDemoStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const OPEN_EVENT = "acre:open-command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

interface Command {
  id: string;
  group: "Go to" | "Listings" | "View as" | "Demo";
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords?: string;
  run: () => void;
}

const PAGES: { href: string; label: string; icon: React.ReactNode; keywords: string }[] = [
  { href: "/", label: "Home", icon: <Home className="h-4 w-4" />, keywords: "landing marketing start" },
  { href: "/explore", label: "Explore land", icon: <MapIcon className="h-4 w-4" />, keywords: "map listings search find plot" },
  { href: "/requests", label: "My requests", icon: <Send className="h-4 w-4" />, keywords: "grower status applied" },
  { href: "/inbox", label: "Landowner inbox", icon: <Inbox className="h-4 w-4" />, keywords: "requests accept decline owner" },
  { href: "/landowner", label: "My land (listing)", icon: <LandPlot className="h-4 w-4" />, keywords: "property owner listing edit" },
  { href: "/landowner?mode=new", label: "List new land", icon: <LandPlot className="h-4 w-4" />, keywords: "create add property" },
  { href: "/growers", label: "Growers", icon: <Users className="h-4 w-4" />, keywords: "applicants profiles" },
  { href: "/optimizer", label: "Plot optimizer", icon: <LayoutGrid className="h-4 w-4" />, keywords: "allocate plan engine shared plot" },
  { href: "/agreements", label: "Agreement drafts", icon: <FileSignature className="h-4 w-4" />, keywords: "lease contract draft" },
  { href: "/dashboard", label: "Organization dashboard", icon: <LayoutDashboard className="h-4 w-4" />, keywords: "program coordinator kpis" },
];

const ROLE_ITEMS: { role: Role; label: string; home: string; icon: React.ReactNode }[] = [
  { role: "grower", label: "Grower", home: "/explore", icon: <Sprout className="h-4 w-4" /> },
  { role: "landowner", label: "Landowner", home: "/landowner", icon: <LandPlot className="h-4 w-4" /> },
  { role: "coordinator", label: "Program coordinator", home: "/dashboard", icon: <Building2 className="h-4 w-4" /> },
];

function matches(c: Command, q: string) {
  if (!q) return true;
  const hay = `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
}

/** Cmd/Ctrl+K palette: navigate, jump to a listing, switch the demo role or reset the demo. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  return <AnimatePresence>{open && <Palette onClose={() => setOpen(false)} />}</AnimatePresence>;
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const { state, setRole, setActiveProperty, reset } = useDemoStore();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const listId = useId();

  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => restoreFocus.current?.focus?.();
  }, []);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    return [
      ...PAGES.map((p) => ({ id: `page:${p.href}`, group: "Go to" as const, label: p.label, icon: p.icon, keywords: p.keywords, run: go(p.href) })),
      ...state.properties.map((p) => ({
        id: `property:${p.id}`,
        group: "Listings" as const,
        label: p.name,
        hint: p.region,
        icon: <MapPin className="h-4 w-4" />,
        keywords: `${p.location} ${p.region} property farm`,
        run: () => {
          setActiveProperty(p.id);
          router.push(`/explore?property=${p.id}`);
        },
      })),
      ...ROLE_ITEMS.map((r) => ({
        id: `role:${r.role}`,
        group: "View as" as const,
        label: `View as ${r.label}`,
        icon: r.icon,
        keywords: "switch role persona",
        run: () => {
          setRole(r.role);
          router.push(r.home);
        },
      })),
      {
        id: "demo:reset",
        group: "Demo" as const,
        label: "Reset demo data",
        icon: <RotateCcw className="h-4 w-4" />,
        keywords: "restore clear start over",
        run: () => {
          reset();
          toast({ message: "Demo data reset to the synthetic seed." });
        },
      },
    ];
  }, [state.properties, router, setActiveProperty, setRole, reset, toast]);

  const results = commands.filter((c) => matches(c, query));
  const current = Math.min(active, Math.max(0, results.length - 1));

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${current}"]`)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  function runAt(i: number) {
    const c = results[i];
    if (!c) return;
    onClose();
    c.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((current + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((current - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(current);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" data-testid="command-palette">
      <motion.div
        className="absolute inset-0 bg-forest-deep/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DURATION.short }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-paper shadow-lift"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: DURATION.short } }}
        transition={{ duration: DURATION.medium, ease: EASE.emphasizedDecelerate }}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search pages, listings and actions…"
            className="h-14 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted"
            style={{ outline: "none" }}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[current] ? `${listId}-${current}` : undefined}
            aria-autocomplete="list"
          />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted">Esc</kbd>
        </div>
        <ul ref={listRef} id={listId} role="listbox" aria-label="Commands" className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-[13px] text-muted">No matches for “{query}”.</li>}
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            const isActive = i === current;
            return (
              <li key={c.id} role="presentation">
                {header && <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">{header}</p>}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isActive}
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => runAt(i)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors",
                    isActive ? "bg-forest text-paper" : "text-ink",
                  )}
                >
                  <span className={isActive ? "text-gold" : "text-forest"}>{c.icon}</span>
                  <span className="flex-1 truncate">{c.label}</span>
                  {c.hint && <span className={cn("text-[12px]", isActive ? "text-paper/70" : "text-muted")}>{c.hint}</span>}
                  {isActive ? <CornerDownLeft className="h-3.5 w-3.5 text-paper/70" /> : <ArrowRight className="h-3.5 w-3.5 text-transparent" />}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 border-t border-line bg-cream/60 px-4 py-2 text-[11.5px] text-muted">
          <span>
            <kbd className="font-sans">↑↓</kbd> to move
          </span>
          <span>
            <kbd className="font-sans">Enter</kbd> to open
          </span>
          <span className="ml-auto">
            <kbd className="font-sans">⌘K</kbd> / <kbd className="font-sans">Ctrl K</kbd> anywhere
          </span>
        </div>
      </motion.div>
    </div>
  );
}
