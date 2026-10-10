import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/motion";
import { HeroPlan } from "@/components/home/hero-plan";
import { HowItWorksSteps } from "@/components/home/how-it-works";
import { MapTeaser } from "@/components/home/map-teaser";
import { RoleCards } from "@/components/home/role-cards";
import { ButtonLink, Eyebrow } from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        <Hero />
        <HowItWorks />
        <MapSection />
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
            Landowners share spare land. Growers get the quarter-acre they need to start.
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
            Try Live Demo
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

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-cream py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">From open field to shared harvest.</h2>
        </Reveal>
        <HowItWorksSteps />
      </div>
    </section>
  );
}

function MapSection() {
  return (
    <section id="map" className="scroll-mt-20 bg-paper py-24 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <Eyebrow>Explore land</Eyebrow>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">Find a plot near you.</h2>
          <p className="mt-5 text-[16px] leading-relaxed text-muted">Pick a pin to see if it fits your crop, budget and travel.</p>
          <ButtonLink href="/explore" className="mt-8" size="lg">
            Open the map <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </Reveal>
        <Reveal delay={0.1}>
          <MapTeaser />
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
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/landowner?mode=new" variant="gold" size="lg">
            List Your Land
          </ButtonLink>
          <ButtonLink href="/explore" variant="light" size="lg">
            Find Land
          </ButtonLink>
        </div>
        <p className="mt-10 text-[13px] text-paper/60">
          A prototype with synthetic data.{" "}
          <Link href="/about#trust" className="underline underline-offset-2 hover:text-paper">
            What we do and don&apos;t claim
          </Link>
        </p>
      </Reveal>
    </section>
  );
}
