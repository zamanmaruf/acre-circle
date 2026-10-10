import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import mark from "../../public/brand/acre-circle-mark.png";

export function LogoMark({ onDark, className }: { onDark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-[transform,background-color] duration-300 group-hover:scale-105",
        onDark && "bg-paper p-1 shadow-sm",
        className,
      )}
    >
      <Image src={mark} alt="" aria-hidden="true" className="h-full w-full object-contain" priority sizes="36px" />
    </span>
  );
}

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", light ? "text-paper" : "text-forest", className)} aria-label="Acre Circle home">
      <LogoMark onDark={light} />
      <span className="font-serif text-[21px] font-semibold tracking-tight whitespace-nowrap">Acre Circle</span>
    </Link>
  );
}
