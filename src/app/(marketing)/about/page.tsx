import type { Metadata } from "next";
import { ArrowRight, Building2, Car, CircleDollarSign, ClipboardCheck, Droplets, Ruler, ScanSearch, ShieldCheck, Sprout, Tractor } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/motion";
import { ImpactStats } from "@/components/home/impact-stats";
import { ButtonLink, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description: "Why Acre Circle matters in Nova Scotia, how the plot engine decides, and what this prototype does and doesn't claim.",
};

const FACTORS = [
  { icon: <Ruler className="h-4 w-4" />, title: "Area" },
  { icon: <Sprout className="h-4 w-4" />, title: "Crops & practices" },
  { icon: <CircleDollarSign className="h-4 w-4" />, title: "Budgets" },
  { icon: <Droplets className="h-4 w-4" />, title: "Water" },
  { icon: <Car className="h-4 w-4" />, title: "Access & travel" },
  { icon: <Tractor className="h-4 w-4" />, title: "Shared resources" },
];

const TRUST = [
  "All demo people, properties and organizations are synthetic.",
  "Ownership, water, soil and permissions are never assumed. Unverified items are flagged.",
  "No guarantees of yields, income, suitability or legal compliance.",
  "Agreements are drafts for professional review, not legal advice.",
];

export default function AboutPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <section className="bg-forest-deep pt-36 pb-20 text-paper">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="text-[12px] font-semibold tracking-[0.22em] text-gold uppercase">About Acre Circle</p>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.05] sm:text-6xl">Why it matters, and how it decides.</h1>
          </div>
        </section>

        <section id="impact" className="scroll-mt-20 bg-cream py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="max-w-3xl">
              <Eyebrow>Why Nova Scotia</Eyebrow>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">Fewer farms, older farmers, land waiting.</h2>
            </Reveal>
            <ImpactStats />
            <p className="mt-4 text-[12.5px] text-muted">
              Statistics Canada,{" "}
              <a
                className="underline underline-offset-2 hover:text-forest"
                href="https://www150.statcan.gc.ca/n1/pub/96-325-x/2021001/article/00003-eng.htm"
                target="_blank"
                rel="noreferrer"
              >
                2021 Census of Agriculture
              </a>
              . Historical figures, not Acre Circle results. We have no pilot results yet.
            </p>
          </div>
        </section>

        <section id="ai" className="scroll-mt-20 bg-forest-deep py-20 text-paper sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <Reveal>
              <p className="text-[11.5px] font-semibold tracking-[0.18em] text-gold uppercase">How it decides</p>
              <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Not just who could fit. Who fits together.</h2>
              <div className="mt-8 flex flex-wrap gap-2">
                {FACTORS.map((f) => (
                  <span key={f.title} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[13px] text-paper/85">
                    <span className="text-gold">{f.icon}</span>
                    {f.title}
                  </span>
                ))}
              </div>
            </Reveal>
            <div className="space-y-4">
              <Reveal delay={0.05} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-gold uppercase">
                  <ScanSearch className="h-4 w-4" /> The engine decides
                </p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-paper/75">
                  A deterministic constraint solver checks every applicant and every combination. Same inputs, same plan, with a reason for each decision.
                </p>
              </Reveal>
              <Reveal delay={0.1} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-gold uppercase">
                  <ClipboardCheck className="h-4 w-4" /> AI explains (optional)
                </p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-paper/75">
                  A language model can rewrite the engine&apos;s facts in plain English. It can&apos;t change decisions. Without an API key, rule-based
                  explanations are shown and labelled.
                </p>
              </Reveal>
              <ButtonLink href="/optimizer" variant="gold" size="lg" className="w-full">
                See the optimizer work <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </section>

        <section id="organizations" className="scroll-mt-20 bg-paper py-20 sm:py-24">
          <Reveal className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <Eyebrow>
                <span className="inline-flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" /> For organizations
                </span>
              </Eyebrow>
              <h2 className="mt-4 font-serif text-4xl leading-tight text-forest">One workspace for land-access programs.</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                Listings, requests, plot plans and agreement review in one place. Proposed model: organizations subscribe, landowners and growers join free.
                Not validated revenue.
              </p>
            </div>
            <ButtonLink href="/dashboard" variant="secondary" size="lg" className="justify-self-start lg:justify-self-end">
              Open Organization Dashboard <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </Reveal>
        </section>

        <section id="trust" className="scroll-mt-20 bg-cream py-20 sm:py-24">
          <Reveal className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-soft text-forest">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="mt-5 font-serif text-3xl text-forest">Honest by design</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">We surface uncertainty instead of hiding it. Every big decision needs a human.</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {TRUST.map((t) => (
                <li key={t} className="rounded-2xl border border-line bg-paper px-5 py-4 text-[14.5px] leading-relaxed text-ink/85">
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
