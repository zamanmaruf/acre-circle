import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/playfair-display";
import "./globals.css";
import { DemoStoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: {
    default: "Acre Circle — One Land. Endless Possibilities.",
    template: "%s · Acre Circle",
  },
  description:
    "Acre Circle connects Nova Scotia landowners with aspiring growers through constraint-based matching, shared plot planning and micro-lease drafting.",
};

export const viewport: Viewport = {
  themeColor: "#073F2B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <DemoStoreProvider>{children}</DemoStoreProvider>
      </body>
    </html>
  );
}
