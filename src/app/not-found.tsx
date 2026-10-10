import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <h1 className="font-serif text-4xl text-forest">This plot hasn&apos;t been planted yet.</h1>
      <p className="max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist. Head back to the demo or the homepage.</p>
      <div className="flex gap-2">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/optimizer" variant="secondary">
          Plot optimizer
        </ButtonLink>
      </div>
    </div>
  );
}
