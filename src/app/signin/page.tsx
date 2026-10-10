import Image from "next/image";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { SignInRoles } from "./role-list";

export const metadata: Metadata = { title: "Sign in (demo)", description: "Choose a role to explore the Acre Circle demo with synthetic data." };

export default function SignInPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="my-auto max-w-md py-12">
          <p className="text-[11.5px] font-semibold tracking-[0.18em] text-gold-deep uppercase">Demo sign-in</p>
          <h1 className="mt-3 font-serif text-4xl text-forest">Choose how you&apos;d like to explore</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            This prototype has no accounts or passwords. Pick a role to enter the demo with synthetic data. Nothing you enter leaves your browser, and you
            can switch roles any time from the header.
          </p>
          <SignInRoles />
          <p className="mt-6 text-[12px] text-muted">Production would use real authentication and role-based access. Not implemented in this prototype.</p>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image src="/images/seedlings.jpg" alt="Hands planting seedlings in a tray" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/10 to-transparent" />
        <div className="absolute top-10 right-10 rounded-3xl bg-paper/95 p-4 shadow-lift backdrop-blur">
          <Image src="/brand/acre-circle-logo.png" alt="Acre Circle — Land, Opportunity, Together" width={180} height={180} className="h-auto w-[150px]" />
        </div>
        <p className="absolute right-12 bottom-12 left-12 font-serif text-3xl leading-snug text-paper">&ldquo;Your land could be someone&apos;s beginning.&rdquo;</p>
      </div>
    </div>
  );
}
