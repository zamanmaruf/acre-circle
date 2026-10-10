import { AppHeader, DemoStepper, ResetDemoButton } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:pb-20">{children}</main>
      <DemoStepper />
      <footer className="no-print flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-line px-4 py-5 text-center text-xs text-muted">
        <span>Acre Circle prototype · All people, properties and organizations are synthetic. Not legal, financial or agronomic advice.</span>
        <ResetDemoButton />
      </footer>
    </div>
  );
}
