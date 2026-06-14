"use client";

import Link from "next/link";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { CardSkeleton } from "@/components/ui/skeleton";
import { BrandLogo } from "@/components/shared/brand-logos";
import { OPPORTUNITIES, formatPay } from "@/lib/opportunities";

export default function OpportunitiesPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const creators = useApp((s) => s.creators);
  const me = creators.find((c) => c.id === userId);

  if (!hydrated || !userId) return <CardSkeleton />;

  const myNiches = (me?.niches ?? []) as string[];
  const matches = (niche: string) =>
    myNiches.some((n) => n.toLowerCase() === niche.toLowerCase());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl font-extrabold leading-[0.95] sm:text-5xl">
          Opportunities
        </h1>
        <p className="mt-2 text-sm font-bold text-text-secondary">
          Brand campaigns looking for creators. Click Apply to see the full brief and send your pitch.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {OPPORTUNITIES.map((op) => {
          const matched = matches(op.niche);
          return (
            <div
              key={op.id}
              className="flex items-center gap-4 rounded-[20px] border-[2.5px] border-ink bg-[#faf6ef] px-5 py-4 shadow-[4px_4px_0_0_#101805]"
            >
              {/* Logo */}
              <div className="shrink-0">
                <BrandLogo brand={op.brand} size={40} />
              </div>

              {/* Brand + campaign */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-serif text-[15px] font-extrabold leading-tight">{op.brand}</p>
                  {matched && (
                    <span className="rounded-full bg-[#a8d98a] px-2 py-0.5 text-[10px] font-bold text-ink">
                      match
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[13px] font-bold text-text-secondary">
                  {op.campaign}
                </p>
              </div>

              {/* Pay + Apply */}
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="num font-serif text-xl font-extrabold text-[#3e7b5e]">
                    {formatPay(op.basePayCents)}
                  </p>
                  <p className="text-[10px] font-bold text-text-tertiary">base pay</p>
                </div>
                <Link
                  href={`/dashboard/opportunities/${op.id}`}
                  className="rounded-full bg-[#f2a3df] px-6 py-3 font-serif text-base font-bold text-ink transition-transform hover:scale-105 active:scale-95"
                >
                  Apply →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
