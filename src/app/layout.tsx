import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/playfair-display";
import "./globals.css";
import { CommandPalette } from "@/components/command-palette";
import { MotionProvider } from "@/components/motion";
import { ToastProvider } from "@/components/toast";
import { DemoStoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Acre Circle — One Land. Endless Possibilities.",
    template: "%s · Acre Circle",
  },
  description:
    "Acre Circle connects Nova Scotia landowners with aspiring growers through constraint-based matching, shared plot planning and micro-lease drafting.",
  openGraph: {
    title: "Acre Circle — One Land. Endless Possibilities.",
    description: "Unused land. Unlimited potential. Shared micro-plots for Nova Scotia's next generation of growers.",
    siteName: "Acre Circle",
    locale: "en_CA",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#073F2B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <MotionProvider>
          <DemoStoreProvider>
            <ToastProvider>
              {children}
              <CommandPalette />
            </ToastProvider>
          </DemoStoreProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
