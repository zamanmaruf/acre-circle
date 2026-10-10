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
          <h1 className="font-serif text-4xl text-forest">What brings you here?</h1>
          <p className="mt-3 text-[15px] text-muted">No account needed. Pick a role to start; you can switch any time.</p>
          <SignInRoles />
          <p className="mt-6 text-[12px] text-muted">Demo only: synthetic data, no real sign-in yet.</p>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image src="/images/seedlings.jpg" alt="Hands planting seedlings in a tray" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/10 to-transparent" />
        <p className="absolute right-12 bottom-12 left-12 font-serif text-3xl leading-snug text-paper">&ldquo;Your land could be someone&apos;s beginning.&rdquo;</p>
      </div>
    </div>
  );
}
