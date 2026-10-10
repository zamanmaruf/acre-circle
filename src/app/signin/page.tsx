import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Building2, LandPlot, Sprout } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Sign in (demo)" };

const ROLES = [
  {
    href: "/dashboard",
    icon: <Building2 className="h-5 w-5" />,
    title: "Agricultural organization",
    body: "Coordinate listings, applicants, plot plans and agreement drafts. The paying customer.",
    tag: "Recommended for judges",
  },
  {
    href: "/landowner",
    icon: <LandPlot className="h-5 w-5" />,
    title: "Landowner",
    body: "List land, set conditions and see how it could be shared.",
  },
  {
    href: "/growers",
    icon: <Sprout className="h-5 w-5" />,
    title: "Aspiring grower",
    body: "Create a profile and find land that fits your crops and budget.",
  },
];

export default function SignInPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="my-auto max-w-md py-12">
          <p className="text-[11.5px] font-semibold tracking-[0.18em] text-gold-deep uppercase">Demo sign-in</p>
          <h1 className="mt-3 font-serif text-4xl text-forest">Choose how you&apos;d like to explore</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            This prototype has no accounts or passwords. Pick a role to enter the demo with synthetic data. Nothing you enter leaves your browser.
          </p>
          <div className="mt-8 space-y-3">
            {ROLES.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group flex items-start gap-4 rounded-2xl border border-line bg-paper p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-forest/30 hover:shadow-lift"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest text-paper">{r.icon}</span>
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-forest">{r.title}</span>
                    {r.tag && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-gold-deep">{r.tag}</span>}
                  </span>
                  <span className="mt-1 block text-[13.5px] text-muted">{r.body}</span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-forest" />
              </Link>
            ))}
          </div>
          <p className="mt-6 text-[12px] text-muted">Production would use real authentication and role-based access. Not implemented in this prototype.</p>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image src="/images/seedlings.jpg" alt="Hands planting seedlings in a tray" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-transparent to-transparent" />
        <p className="absolute right-12 bottom-12 left-12 font-serif text-3xl leading-snug text-paper">&ldquo;Your land could be someone&apos;s beginning.&rdquo;</p>
      </div>
    </div>
  );
}
