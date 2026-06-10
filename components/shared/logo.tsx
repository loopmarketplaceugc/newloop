import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2 font-serif text-lg font-semibold tracking-tight", className)}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-text-primary font-sans text-[11px] font-bold text-bg">
        M
      </span>
      <span>
        MCC<span className="text-text-tertiary font-sans text-[13px] font-normal ml-2 hidden sm:inline">Marketplace for Content Creation</span>
      </span>
    </Link>
  );
}
