"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { CardSkeleton } from "@/components/ui/skeleton";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { companyById } from "@/lib/seed";
import { creatorPayoutCents } from "@/lib/gig-machine";
import { daysUntil, formatMoney } from "@/lib/format";

export default function GigsPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const role = useSession((s) => s.role);
  const { gigs, creators } = useApp();

  if (!hydrated || !userId) return <CardSkeleton />;

  const mine = gigs
    .filter((g) => (role === "creator" ? g.creatorId === userId : g.companyId === userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-4xl sm:text-5xl font-extrabold leading-[0.95]">Gigs</h1>
        <p className="mt-2 text-sm font-bold text-text-secondary">
          Every deal, from first offer to payout.
        </p>
      </div>
      {mine.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No gigs yet"
          body={
            role === "creator"
              ? "Offers from brands appear here. Make sure your profile is set to Open to Work."
              : "Find a creator on Discover and send your first offer."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
          {mine.map((g) => {
            const other =
              role === "creator"
                ? { name: companyById(g.companyId)?.name ?? "Brand", hue: companyById(g.companyId)?.logoHue ?? 0 }
                : (() => {
                    const c = creators.find((c) => c.id === g.creatorId);
                    return { name: c?.name ?? "Creator", hue: c?.avatarHue ?? 0 };
                  })();
            const amount = role === "creator" ? creatorPayoutCents(g.priceCents) : g.priceCents;
            return (
              <Link
                key={g.id}
                href={`/gig/${g.id}`}
                className="flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-0 hover:bg-surface-2/40"
              >
                <Avatar name={other.name} hue={other.hue} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{g.title}</p>
                  <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    <PlatformIcon platform={g.platform} className="h-3 w-3" />
                    {other.name}
                    {g.deadline && daysUntil(g.deadline) > 0 && (
                      <> · due <span className="num">{daysUntil(g.deadline)}d</span></>
                    )}
                  </p>
                </div>
                <span className="num hidden text-sm font-semibold sm:block">{formatMoney(amount)}</span>
                <StatusPill status={g.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
