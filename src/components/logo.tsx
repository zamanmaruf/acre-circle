import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="currentColor" opacity="0.12" />
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 4.5v23M4.5 16h23" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <path d="M16 16 C16 11, 19.5 8.5, 23 8.5 C23 12.5, 20 16, 16 16Z" fill="#D8AA62" />
      <path d="M16 16 C16 20, 12.5 23, 9 23 C9 19, 12 16, 16 16Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", light ? "text-paper" : "text-forest", className)} aria-label="Acre Circle home">
      <LogoMark className="transition-transform duration-500 group-hover:rotate-45" />
      <span className="font-serif text-[21px] font-semibold tracking-tight whitespace-nowrap">Acre Circle</span>
    </Link>
  );
}
