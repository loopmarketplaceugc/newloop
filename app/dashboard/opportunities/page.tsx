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
            <Link
              key={op.id}
              href={`/dashboard/opportunities/${op.id}`}
              className="group flex items-center gap-4 rounded-[24px] border border-ink/10 bg-surface px-5 py-4 shadow-[0_1px_3px_rgba(16,24,5,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_12px_32px_-10px_rgba(16,24,5,0.20)]"
            >
              {/* Logo */}
              <div className="shrink-0">
                <BrandLogo brand={op.brand} size={44} />
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
                <p className="num mt-0.5 text-sm font-bold text-money">
                  {formatPay(op.basePayCents)} <span className="text-text-tertiary">base pay</span>
                </p>
              </div>

              {/* Apply */}
              <span className="shrink-0 rounded-full bg-[#f2a3df] px-7 py-3.5 font-serif text-[15px] font-bold text-ink shadow-[0_4px_14px_-4px_rgba(242,163,223,0.7)] transition-transform group-hover:scale-[1.04]">
                Apply →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
