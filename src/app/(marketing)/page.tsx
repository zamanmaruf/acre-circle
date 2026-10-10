import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Car,
  CircleDollarSign,
  ClipboardCheck,
  Droplets,
  LandPlot,
  MapPinned,
  Play,
  Ruler,
  ScanSearch,
  ShieldCheck,
  Sprout,
  Tractor,
  Warehouse,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/motion";
import { HeroPlan } from "@/components/home/hero-plan";
import { HowItWorksSteps } from "@/components/home/how-it-works";
import { ImpactStats } from "@/components/home/impact-stats";
import { MapTeaser } from "@/components/home/map-teaser";
import { RoleCards } from "@/components/home/role-cards";
import { ButtonLink, Eyebrow } from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <MapSection />
        <EngineAndOrganizations />
        <ImpactAndTrust />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-forest-deep">
      <Image
        src="/images/hero-valley.jpg"
        alt="Rolling farmland in a valley at sunset"
        fill
        priority
        sizes="100vw"
        className="-z-20 animate-[hero-zoom_18s_ease-out_both] object-cover object-[50%_60%]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-deep/95 via-forest-deep/70 to-forest-deep/20" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-forest-deep/70 to-transparent" />

      <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-5 pt-28 pb-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-2xl">
          <p className="animate-fade-up text-[12px] font-semibold tracking-[0.22em] text-gold uppercase">Shared micro-plots for Nova Scotia</p>
          <h1 className="mt-6 animate-fade-up font-serif text-[52px] leading-[1.02] font-medium text-paper [animation-delay:60ms] sm:text-[68px] lg:text-[78px]">
            Unused Land.
            <br />
            <span className="text-sage italic">Unlimited Potential.</span>
          </h1>
          <p className="mt-6 max-w-xl animate-fade-up text-[17px] leading-relaxed text-paper/80 [animation-delay:120ms] sm:text-lg">
            Acre Circle helps landowners share part of their land with growers who need a quarter-acre, not a farm, and plans who fits where.
          </p>
          <p className="mt-9 mb-3 animate-fade-up text-[13px] font-medium text-paper/70 [animation-delay:180ms]">What brings you here?</p>
          <RoleCards />
          <Link
            href="/landowner"
            className="group mt-7 inline-flex animate-fade-up items-center gap-3 rounded-full border border-white/20 bg-white/10 py-1.5 pr-4 pl-1.5 text-sm text-paper backdrop-blur transition-colors [animation-delay:500ms] hover:bg-white/15"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-forest">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            Try Live Demo: Harbour Valley Farm walkthrough
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="relative hidden animate-fade-up [animation-delay:250ms] lg:block">
          <HeroPlan />
        </div>
      </div>
    </section>
  );
}

function ProblemSolution() {
  const rows = [
    { plot: "A", color: "#0F5A3E", who: "Garlic grower", acres: "0.50 ac" },
    { plot: "B", color: "#7FA874", who: "Specialty vegetables", acres: "0.50 ac" },
    { plot: "C", color: "#D8AA62", who: "Culinary herbs", acres: "0.25 ac" },
    { plot: "D", color: "#3F7F7A", who: "Community food project", acres: "0.25 ac" },
  ];
  return (
    <section className="bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">
            The land exists. The ambition exists. <span className="italic text-gold-deep">The connection is missing.</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <StoryCard
              icon={<LandPlot className="h-5 w-5" />}
              who="Landowners"
              title="Space they can't fully use"
              body="Some Nova Scotia property owners have open, potentially cultivable land they can't farm themselves, and no simple, low-risk way to share part of it."
            />
          </Reveal>
          <Reveal delay={0.08}>
            <StoryCard
              icon={<Sprout className="h-5 w-5" />}
              who="Aspiring growers"
              title="Skills without affordable land"
              body="New farmers, market gardeners and community groups need a quarter to one acre for a first season, with budgets measured per month, not per mortgage."
            />
          </Reveal>
        </div>

        <div className="mt-20 grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>The solution</Eyebrow>
            <h3 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-[44px]">One property. More possibilities.</h3>
            <p className="mt-5 text-[16px] leading-relaxed text-muted">
              Instead of one tenant or none, Acre Circle works out how a property could support several compatible growers, each with the plot, budget
              and resources they need, while keeping shared space for tools, parking and access.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-cream/60 shadow-soft">
              {rows.map((r) => (
                <div key={r.plot} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-paper">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg font-serif font-semibold text-paper" style={{ background: r.color }}>
                    {r.plot}
                  </span>
                  <span className="flex-1 text-[15px] text-ink">{r.who}</span>
                  <span className="font-medium text-forest">{r.acres}</span>
                </div>
              ))}
              <div className="flex items-center gap-4 bg-cream px-5 py-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFE7D3] text-[#7A6A44]">
                  <Warehouse className="h-4 w-4" />
                </span>
                <span className="flex-1 text-[15px] text-ink">Shared yard, tools &amp; access</span>
                <span className="font-medium text-forest">0.50 ac</span>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] text-muted">Illustrative two-acre example using synthetic data. Real plans depend on site verification.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function StoryCard({ icon, who, title, body }: { icon: React.ReactNode; who: string; title: string; body: string }) {
  return (
    <div className="h-full rounded-3xl border border-line bg-cream/70 p-8 transition-shadow hover:shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest text-paper">{icon}</span>
        <span className="text-[12px] font-semibold tracking-[0.16em] text-gold-deep uppercase">{who}</span>
      </div>
      <h3 className="mt-6 font-serif text-[26px] text-forest">{title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">From open field to shared harvest, in four steps.</h2>
          </div>
          <ButtonLink href="/landowner" variant="secondary">
            Walk through the demo <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </Reveal>
        <HowItWorksSteps />
      </div>
    </section>
  );
}

function MapSection() {
  return (
    <section id="map" className="scroll-mt-20 bg-paper py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <Eyebrow>Explore land</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">Find a plot near you.</h2>
          <p className="mt-5 text-[16px] leading-relaxed text-muted">
            Every listing sits on a real map of Nova Scotia, with its acreage and rent on the pin. Pick one to see how well it fits your crop, budget and
            travel limit, then request a plot in a single step.
          </p>
          <ul className="mt-6 space-y-2.5 text-[14.5px] text-ink/85">
            {["See your travel radius drawn on the map", "Fit checks for water, access, season and budget", "Owners reply in their inbox; you get notified"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <MapPinned className="h-4 w-4 text-gold-deep" /> {t}
              </li>
            ))}
          </ul>
          <ButtonLink href="/explore" className="mt-8" size="lg">
            Open the map <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <p className="mt-3 text-[12px] text-muted">Listings are fictional and pins are approximate. Map data © OpenStreetMap contributors.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <MapTeaser />
        </Reveal>
      </div>
    </section>
  );
}

function EngineAndOrganizations() {
  const factors = [
    { icon: <Ruler className="h-4 w-4" />, title: "Area" },
    { icon: <Sprout className="h-4 w-4" />, title: "Crops & practices" },
    { icon: <CircleDollarSign className="h-4 w-4" />, title: "Budgets" },
    { icon: <Droplets className="h-4 w-4" />, title: "Water" },
    { icon: <Car className="h-4 w-4" />, title: "Access & travel" },
    { icon: <Tractor className="h-4 w-4" />, title: "Shared resources" },
  ];
  return (
    <section id="ai" className="scroll-mt-20 bg-forest-deep py-24 text-paper sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <p className="text-[11.5px] font-semibold tracking-[0.18em] text-gold uppercase">Our approach to AI</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">More than matching. Intelligent land sharing.</h2>
            <p className="mt-5 text-[16px] leading-relaxed text-paper/70">
              A marketplace filter tells you who <em>could</em> fit. Acre Circle works out who can farm <em>together</em>: how the space divides, which
              resources are needed, and what still has to be confirmed before anyone signs.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {factors.map((f) => (
                <span key={f.title} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[13px] text-paper/85">
                  <span className="text-gold">{f.icon}</span>
                  {f.title}
                </span>
              ))}
            </div>
          </Reveal>
          <div className="space-y-4">
            <Reveal delay={0.05} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 text-gold">
                <ScanSearch className="h-4 w-4" />
                <p className="text-[13px] font-semibold tracking-wide uppercase">1 · The engine decides</p>
              </div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-paper/75">
                A deterministic constraint solver screens every applicant and exhaustively searches every combination. Same inputs, same plan, every
                time. Auditable, with a reason for each decision.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 text-gold">
                <ClipboardCheck className="h-4 w-4" />
                <p className="text-[13px] font-semibold tracking-wide uppercase">2 · Language AI explains (optional)</p>
              </div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-paper/75">
                An optional language model rewrites the engine&apos;s structured facts into plain English. It cannot change decisions or invent soil,
                yields, legal status or water. Without an API key, the app shows rule-based explanations, labelled as such.
              </p>
            </Reveal>
            <ButtonLink href="/optimizer" variant="gold" size="lg" className="w-full">
              See the optimizer work <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>

        <Reveal className="mt-20 grid items-center gap-10 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex items-center gap-2 text-[13px] font-medium text-gold">
              <Building2 className="h-4 w-4" /> For organizations
            </div>
            <h3 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">Built for the programs that make land access happen.</h3>
            <p className="mt-4 text-[15px] leading-relaxed text-paper/70">
              Agricultural nonprofits, cooperatives and university farm programs coordinate dozens of landowners and applicants. Acre Circle gives them
              one workspace for listings, requests, plot plans and agreement review.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-paper/60">
              <strong className="text-paper">Proposed model:</strong> organizations subscribe; landowners and growers join free. This is a proposal, not
              validated revenue.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {["Request inbox for every listing", "Run the optimizer per property", "Move matches into agreement review"].map((t) => (
              <div key={t} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-paper/85">
                <span className="h-2 w-2 rounded-full bg-gold" />
                {t}
              </div>
            ))}
            <ButtonLink href="/dashboard" variant="light" className="mt-2">
              Open Organization Dashboard <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ImpactAndTrust() {
  const trust = [
    "All demo people, properties and organizations are synthetic.",
    "Ownership, water, soil and legal permissions are never assumed. Unverified items are flagged.",
    "No guarantees of yields, income, suitability or legal compliance.",
    "Agreements are drafts for discussion and professional review, not legal advice.",
  ];
  return (
    <section id="impact" className="relative scroll-mt-20 overflow-hidden bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-3xl">
          <Eyebrow>Why it matters in Nova Scotia</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">Fewer farms, older farmers, and land waiting for its next grower.</h2>
        </Reveal>
        <ImpactStats />
        <p className="mt-4 text-[12.5px] text-muted">
          Historical figures from Statistics Canada,{" "}
          <a
            className="underline underline-offset-2 hover:text-forest"
            href="https://www150.statcan.gc.ca/n1/pub/96-325-x/2021001/article/00003-eng.htm"
            target="_blank"
            rel="noreferrer"
          >
            2021 Census of Agriculture
          </a>
          . They describe 2016–2021, not current-year conditions, and are not results of Acre Circle. We have no pilot results yet.
        </p>

        <Reveal id="trust" className="mt-16 grid gap-8 rounded-3xl border border-line bg-paper p-8 sm:p-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-soft text-forest">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-serif text-3xl text-forest">Honest by design</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">Responsible coordination means surfacing uncertainty, not hiding it. Every consequential decision needs a human.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {trust.map((i) => (
              <li key={i} className="rounded-2xl border border-line bg-cream/50 px-5 py-4 text-[14.5px] leading-relaxed text-ink/85">
                {i}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-forest-deep py-28 sm:py-36">
      <Image src="/images/market.jpg" alt="Fresh vegetables at a farmers' market" fill sizes="100vw" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-forest-deep/80" />
      <Reveal className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="font-serif text-4xl leading-tight text-paper sm:text-6xl">
          Your Land Could Be <span className="italic text-gold">Someone&apos;s Beginning.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-paper/75">
          Whether you have a corner of a field or the ambition to grow, Acre Circle helps you find the right people to do it with.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/landowner?mode=new" variant="gold" size="lg">
            List Your Land
          </ButtonLink>
          <ButtonLink href="/explore" variant="light" size="lg">
            Find Land
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
