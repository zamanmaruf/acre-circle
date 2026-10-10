import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarRange,
  Car,
  CircleDollarSign,
  ClipboardCheck,
  Droplets,
  FileSignature,
  Handshake,
  LandPlot,
  LayoutGrid,
  MapPinned,
  Play,
  Ruler,
  ScanSearch,
  ShieldCheck,
  Sprout,
  Tractor,
  Users,
  Warehouse,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { MicroPlotIllustration } from "@/components/micro-plot-illustration";
import { ButtonLink, Eyebrow } from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <AiSection />
        <ForOrganizations />
        <Impact />
        <Trust />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-forest-deep">
      <Image src="/images/hero-valley.jpg" alt="Rolling farmland in a valley at sunset" fill priority sizes="100vw" className="-z-20 object-cover object-[50%_60%]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-deep/90 via-forest-deep/60 to-forest-deep/10" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-forest-deep/70 to-transparent" />

      <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-5 pt-28 pb-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="max-w-2xl animate-fade-up">
          <p className="text-[12px] font-semibold tracking-[0.22em] text-gold uppercase">Building a more connected agricultural future</p>
          <h1 className="mt-6 font-serif text-[52px] leading-[1.02] font-medium text-paper sm:text-[68px] lg:text-[80px]">
            Unused Land.
            <br />
            <span className="text-sage italic">Unlimited Potential.</span>
          </h1>
          <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-paper/80 sm:text-lg">
            Acre Circle connects landowners with aspiring growers through AI-powered matching, shared plot planning, and accessible farming
            opportunities.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/growers" variant="gold" size="lg">
              Find Your Growing Space <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/landowner?mode=new" variant="light" size="lg">
              List Your Land
            </ButtonLink>
          </div>
          <Link
            href="/landowner"
            className="group mt-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 py-1.5 pr-4 pl-1.5 text-sm text-paper backdrop-blur transition-colors hover:bg-white/15"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-forest">
              <Play className="h-3.5 w-3.5 fill-current" />
            </span>
            Try Live Demo: Harbour Valley Farm walkthrough
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="relative hidden lg:block">
          <div className="animate-fade-up rounded-[28px] border border-white/15 bg-paper/95 p-5 shadow-lift backdrop-blur [animation-delay:150ms]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-gold-deep uppercase">Illustrative example</p>
                <p className="font-serif text-xl text-forest">2 acres → 4 growing opportunities</p>
              </div>
              <span className="rounded-full bg-sage-soft px-2.5 py-1 text-[11px] font-medium text-forest">Shared plot plan</span>
            </div>
            <MicroPlotIllustration />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
              <div className="rounded-xl bg-cream px-2 py-2">
                <p className="font-serif text-lg text-forest">1.50 ac</p>
                <p className="text-muted">cultivated</p>
              </div>
              <div className="rounded-xl bg-cream px-2 py-2">
                <p className="font-serif text-lg text-forest">4</p>
                <p className="text-muted">growers</p>
              </div>
              <div className="rounded-xl bg-cream px-2 py-2">
                <p className="font-serif text-lg text-forest">0.50 ac</p>
                <p className="text-muted">shared yard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">
            The land exists. The ambition exists. <span className="italic text-gold-deep">The connection is missing.</span>
          </h2>
        </div>

        <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <StoryCard
            icon={<LandPlot className="h-5 w-5" />}
            who="Landowners"
            title="Space they can't fully use"
            body="Some Nova Scotia property owners have open, potentially cultivable land they can't farm or maintain themselves, and no simple, low-risk way to share part of it."
            points={["Unsure who would be a good fit", "Worried about access, water and liability", "Leasing whole fields feels like too big a step"]}
          />
          <div className="flex items-center justify-center">
            <div className="relative flex h-full min-h-[120px] flex-col items-center justify-center">
              <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-line-strong to-transparent lg:block" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-line bg-cream text-gold-deep shadow-soft">
                <Handshake className="h-7 w-7" />
              </div>
              <p className="relative mt-3 max-w-[140px] text-center text-[12px] font-medium tracking-wide text-muted">One coordination problem</p>
            </div>
          </div>
          <StoryCard
            icon={<Sprout className="h-5 w-5" />}
            who="Aspiring growers"
            title="Skills without affordable land"
            body="New farmers, market gardeners and community groups may have the skills and ambition to grow, but buying or leasing a full farm is out of reach for a first season."
            points={["Need a quarter to one acre, not fifty", "Budgets measured per month, not per mortgage", "Specific water, access and season needs"]}
          />
        </div>

        <div className="mt-14 overflow-hidden rounded-3xl border border-line bg-cream">
          <div className="grid items-center md:grid-cols-[1fr_1.2fr]">
            <div className="relative h-64 md:h-full md:min-h-[300px]">
              <Image src="/images/connection.jpg" alt="Two people shaking hands across a wheat field" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
            </div>
            <div className="p-8 sm:p-12">
              <p className="font-serif text-2xl leading-snug text-forest sm:text-[28px]">
                Matching one landowner with one tenant isn&apos;t the hard part. Fitting several growers onto one property, fairly, within real constraints,
                is.
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                Land-access coordinators do this today with spreadsheets, phone calls and site visits. Every new constraint (a smaller budget, an
                unverified well, a crop the owner won&apos;t allow) means starting the puzzle again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryCard({ icon, who, title, body, points }: { icon: React.ReactNode; who: string; title: string; body: string; points: string[] }) {
  return (
    <div className="rounded-3xl border border-line bg-cream/70 p-8 transition-shadow hover:shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest text-paper">{icon}</span>
        <span className="text-[12px] font-semibold tracking-[0.16em] text-gold-deep uppercase">{who}</span>
      </div>
      <h3 className="mt-6 font-serif text-[26px] text-forest">{title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{body}</p>
      <ul className="mt-6 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-[14px] text-ink/80">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Solution() {
  const rows = [
    { plot: "A", color: "#0F5A3E", who: "Garlic grower", acres: "0.50 ac" },
    { plot: "B", color: "#7FA874", who: "Specialty vegetables", acres: "0.50 ac" },
    { plot: "C", color: "#D8AA62", who: "Culinary herbs", acres: "0.25 ac" },
    { plot: "D", color: "#3F7F7A", who: "Community food project", acres: "0.25 ac" },
  ];
  return (
    <section className="bg-cream py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <Eyebrow>The solution</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">One Property. More Possibilities.</h2>
          <p className="mt-5 text-[16px] leading-relaxed text-muted">
            Instead of one tenant or none, Acre Circle helps a coordinator see how a property could support several compatible growers, each with the
            plot, budget and resources they actually need, while keeping shared space for tools, parking and access.
          </p>
          <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-paper">
            {rows.map((r) => (
              <div key={r.plot} className="flex items-center gap-4 px-5 py-3.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg font-serif font-semibold text-paper" style={{ background: r.color }}>
                  {r.plot}
                </span>
                <span className="flex-1 text-[15px] text-ink">{r.who}</span>
                <span className="font-medium text-forest">{r.acres}</span>
              </div>
            ))}
            <div className="flex items-center gap-4 bg-cream/60 px-5 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFE7D3] text-[#7A6A44]">
                <Warehouse className="h-4 w-4" />
              </span>
              <span className="flex-1 text-[15px] text-ink">Shared yard, tools &amp; access</span>
              <span className="font-medium text-forest">0.50 ac</span>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] text-muted">Illustrative two-acre example using synthetic data. Real plans depend on site verification.</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[40px] bg-sage/30 blur-2xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-paper p-5 shadow-lift">
            <div className="relative mb-4 h-44 overflow-hidden rounded-2xl">
              <Image src="/images/crop-rows.jpg" alt="Young crop rows in rich soil" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
            <MicroPlotIllustration animated={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <MapPinned className="h-5 w-5" />,
      title: "List available land",
      body: "Owners describe area, access, water, permitted uses and terms. Anything unverified is labelled as such.",
      href: "/landowner",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Discover compatible growers",
      body: "Growers share crop plans, acreage, budgets and resource needs. Every requirement is checked against the property.",
      href: "/growers",
    },
    {
      icon: <LayoutGrid className="h-5 w-5" />,
      title: "Optimize shared plots",
      body: "The engine searches every feasible combination and proposes a plot plan, with reasons for every placement and deferral.",
      href: "/optimizer",
    },
    {
      icon: <FileSignature className="h-5 w-5" />,
      title: "Review agreements & grow",
      body: "Draft micro-lease terms with open questions flagged, ready for discussion and professional review.",
      href: "/agreements",
    },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">From open field to shared harvest, in four steps.</h2>
          </div>
          <ButtonLink href="/landowner" variant="secondary">
            Walk through the demo <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Link key={s.title} href={s.href} className="group relative rounded-3xl border border-line bg-cream/50 p-7 transition-all hover:-translate-y-1 hover:bg-paper hover:shadow-lift">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-paper transition-colors group-hover:bg-gold group-hover:text-forest-deep">
                  {s.icon}
                </span>
                <span className="font-serif text-4xl text-line-strong">0{i + 1}</span>
              </div>
              <h3 className="mt-8 font-serif text-[22px] text-forest">{s.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-forest opacity-0 transition-opacity group-hover:opacity-100">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiSection() {
  const factors = [
    { icon: <Ruler className="h-4 w-4" />, title: "Area", body: "Cultivable acreage, reserved space, and every grower's minimum and desired plot." },
    { icon: <Sprout className="h-4 w-4" />, title: "Grower requirements", body: "Crop type, permitted activities, seasons and growing-practice compatibility." },
    { icon: <CircleDollarSign className="h-4 w-4" />, title: "Budgets", body: "Plot sizes that respect each grower's monthly budget at the owner's rate." },
    { icon: <Droplets className="h-4 w-4" />, title: "Water", body: "Verified, owner-reported or unknown. Never promises water that isn't confirmed." },
    { icon: <Car className="h-4 w-4" />, title: "Access", body: "Vehicle access, approximate travel distance and seasonal availability." },
    { icon: <Tractor className="h-4 w-4" />, title: "Shared resources", body: "Tool storage, wash stations and cold storage, flagged when a need isn't met." },
  ];
  return (
    <section id="ai" className="scroll-mt-20 bg-forest-deep py-24 text-paper sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-[11.5px] font-semibold tracking-[0.18em] text-gold uppercase">Our approach to AI</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">More Than Matching. Intelligent Land Sharing.</h2>
            <p className="mt-5 text-[16px] leading-relaxed text-paper/70">
              A marketplace filter tells you who <em>could</em> fit. Acre Circle works out who can farm <em>together</em>: how the space divides, which
              resources are needed, and what still has to be confirmed before anyone signs.
            </p>
            <div className="mt-10 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 text-gold">
                  <ScanSearch className="h-4 w-4" />
                  <p className="text-[13px] font-semibold tracking-wide uppercase">1 · The engine decides</p>
                </div>
                <p className="mt-2 text-[14.5px] leading-relaxed text-paper/75">
                  A deterministic constraint solver screens every applicant and exhaustively searches every combination. Same inputs, same plan,
                  every time. Auditable, with a reason for each decision.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 text-gold">
                  <ClipboardCheck className="h-4 w-4" />
                  <p className="text-[13px] font-semibold tracking-wide uppercase">2 · Language AI explains (optional)</p>
                </div>
                <p className="mt-2 text-[14.5px] leading-relaxed text-paper/75">
                  An optional language model rewrites the engine&apos;s structured facts into plain English for coordinators. It cannot change decisions or
                  invent soil quality, yields, legal status or water. Without an API key, the app shows transparent rule-based explanations, labelled as such.
                </p>
              </div>
            </div>
          </div>
          <div className="grid content-start gap-4 sm:grid-cols-2">
            {factors.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 transition-colors hover:border-gold/40">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold">{f.icon}</span>
                <h3 className="mt-4 font-serif text-xl">{f.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-paper/65">{f.body}</p>
              </div>
            ))}
            <ButtonLink href="/optimizer" variant="gold" className="sm:col-span-2" size="lg">
              See the optimizer work <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function ForOrganizations() {
  return (
    <section className="bg-paper py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="order-2 lg:order-1">
          <div className="rounded-[28px] border border-line bg-cream p-6 shadow-soft">
            <div className="flex items-center gap-2 text-[13px] font-medium text-forest">
              <Building2 className="h-4 w-4" /> Organization workspace
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ["Listings", "Properties under review"],
                ["Applicants", "Growers seeking land"],
                ["Matches", "Provisional placements"],
              ].map(([t, s]) => (
                <div key={t} className="rounded-2xl border border-line bg-paper p-4">
                  <p className="font-serif text-lg text-forest">{t}</p>
                  <p className="mt-1 text-[12px] text-muted">{s}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {["Run the optimizer for each property", "Track water and soil verification", "Move matches into agreement review"].map((t) => (
                <div key={t} className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-[14px]">
                  <span className="h-2 w-2 rounded-full bg-gold" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <Eyebrow>Who it&apos;s for</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">Built for the organizations that make land access happen.</h2>
          <p className="mt-5 text-[16px] leading-relaxed text-muted">
            Agricultural nonprofits, cooperatives, university farm programs and land-access organizations coordinate dozens of landowners and applicants.
            Acre Circle gives them one workspace for listings, applicants, plot plans and agreement review.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            <strong className="text-forest">Proposed model:</strong> organizations subscribe to the coordination workspace; landowners and growers join
            free. This is a proposal, not validated revenue.
          </p>
          <ButtonLink href="/dashboard" className="mt-8">
            Open Organization Dashboard <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function Impact() {
  const stats = [
    { value: "2,741", label: "census farms in Nova Scotia in 2021" },
    { value: "−21.2%", label: "change in census farm count, 2016 to 2021: the largest decline of any province" },
    { value: "58.2", label: "average farm operator age in 2021, the highest in Canada" },
  ];
  const pilot = [
    "Time required to coordinate placements",
    "Suitable grower–land matches identified",
    "Share of placements that progress to agreements",
    "Landowners participating",
    "Acres actually brought into cultivation",
    "Grower satisfaction",
    "Administrative time saved for organizations",
  ];
  return (
    <section id="impact" className="relative scroll-mt-20 overflow-hidden bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <Eyebrow>Why it matters in Nova Scotia</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">Fewer farms, older farmers, and land waiting for its next grower.</h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.value} className="rounded-3xl border border-line bg-paper p-8 shadow-soft">
              <p className="font-serif text-6xl text-forest">{s.value}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{s.label}</p>
            </div>
          ))}
        </div>
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
          . They describe 2016–2021, not current-year conditions, and are not results of Acre Circle.
        </p>

        <div className="mt-16 grid gap-8 rounded-3xl border border-line bg-paper p-8 sm:p-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h3 className="font-serif text-2xl text-forest">How we&apos;d measure impact in a real pilot</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              We have no pilot results yet. With a partner organization, we would track these outcomes from day one.
            </p>
            <ButtonLink href="/dashboard" variant="secondary" className="mt-6">
              See demo measurements <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {pilot.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-xl border border-line bg-cream/60 px-4 py-3 text-[14px] text-ink/85">
                <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    "All demo people, properties and organizations are synthetic.",
    "Ownership, water, soil and legal permissions are never assumed. Unverified items are flagged.",
    "No guarantees of yields, income, suitability or legal compliance.",
    "Agreements are drafts for discussion and professional review, not legal advice.",
    "Every consequential decision requires human review.",
  ];
  return (
    <section id="trust" className="scroll-mt-20 bg-paper py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-soft text-forest">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-5 font-serif text-3xl text-forest">Honest by design</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">Responsible coordination means surfacing uncertainty, not hiding it.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((i) => (
            <li key={i} className="rounded-2xl border border-line bg-cream/50 px-5 py-4 text-[14.5px] leading-relaxed text-ink/85">
              {i}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="relative isolate overflow-hidden bg-forest-deep py-28 sm:py-36">
      <Image src="/images/market.jpg" alt="Fresh vegetables at a farmers' market" fill sizes="100vw" className="-z-20 object-cover" />
      <div className="absolute inset-0 -z-10 bg-forest-deep/80" />
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
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
      </div>
    </section>
  );
}
