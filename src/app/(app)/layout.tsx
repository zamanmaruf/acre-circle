import { AppHeader, DemoStepper } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <DemoStepper />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="no-print border-t border-line py-5 text-center text-xs text-muted">
        Acre Circle prototype · All people, properties and organizations shown are synthetic. Nothing here is legal, financial or agronomic advice.
      </footer>
    </div>
  );
}
