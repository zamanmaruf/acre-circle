"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { DURATION, EASE } from "@/lib/motion";
import { Logo } from "./logo";
import { ButtonLink, cn } from "./ui";

const LINKS = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/explore", label: "Explore Land" },
  { href: "/#impact", label: "Our Impact" },
];

const MOBILE_LINKS = [
  ...LINKS,
  { href: "/landowner", label: "For Landowners" },
  { href: "/growers", label: "For Growers" },
  { href: "/dashboard", label: "For Organizations" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid ? "border-b border-line bg-paper/90 backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-8 px-5 sm:px-8">
        <Logo light={!solid} />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-2 text-[14px] transition-colors",
                solid ? "text-ink/75 hover:text-forest" : "text-white/80 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <ButtonLink href="/signin" variant={solid ? "ghost" : "light"} size="sm" className={cn(!solid && "border-transparent bg-transparent")}>
            Sign In
          </ButtonLink>
          <ButtonLink href="/signin" variant={solid ? "primary" : "gold"} size="sm">
            Get Started
          </ButtonLink>
        </div>
        <button
          className={cn("ml-auto rounded-full p-2 sm:ml-0 lg:hidden", solid ? "text-forest" : "text-white")}
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.medium, ease: EASE.standard }}
            className="overflow-hidden border-t border-line bg-paper lg:hidden"
            aria-label="Mobile"
          >
            <div className="px-5 pb-5">
              {MOBILE_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block border-b border-line py-3 text-forest">
                  {l.label}
                </Link>
              ))}
              <div className="mt-4 flex gap-2">
                <ButtonLink href="/signin" variant="secondary" size="sm">
                  Sign In
                </ButtonLink>
                <ButtonLink href="/signin" size="sm">
                  Get Started
                </ButtonLink>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
