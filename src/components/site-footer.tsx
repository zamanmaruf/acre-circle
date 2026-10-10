import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/explore", label: "Explore Land" },
      { href: "/optimizer", label: "Plot Optimizer" },
      { href: "/agreements", label: "Agreement Drafts" },
      { href: "/dashboard", label: "Organization Dashboard" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/landowner", label: "For Landowners" },
      { href: "/growers", label: "For Growers" },
      { href: "/signin", label: "Sign In (demo)" },
      { href: "/landowner", label: "Try Live Demo" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/#how-it-works", label: "How It Works" },
      { href: "/#ai", label: "Our Approach to AI" },
      { href: "/#impact", label: "Our Impact" },
      { href: "/#trust", label: "Trust & Limitations" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-forest-deep text-paper/80">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs font-serif text-lg text-paper">One Land. Endless Possibilities.</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/60">
              Coordination software for land-access programs in Nova Scotia. Built for the Tribe AI Hackathon at Saint Mary&apos;s University,
              Halifax.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="text-[12px] font-semibold tracking-[0.16em] text-gold uppercase">{c.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-paper">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-paper/50 md:flex-row md:justify-between">
          <p>© 2026 Acre Circle prototype. All properties, people and organizations in the demo are synthetic.</p>
          <p>Not legal, financial or agronomic advice. Photography via Unsplash.</p>
        </div>
      </div>
    </footer>
  );
}
