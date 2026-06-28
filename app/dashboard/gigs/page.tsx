"use client";

import { useState } from "react";
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
import { ACTIVE_STATUSES, creatorPayoutCents } from "@/lib/gig-machine";
import { daysAgo, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GigStatus } from "@/lib/types";

const PAST_STATUSES: GigStatus[] = ["COMPLETED", "EXPIRED", "PAID_OUT", "CANCELLED"];

type Filter = "all" | "active" | "past";

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  active: "Active",
  past: "Past",
};

export default function GigsPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const role = useSession((s) => s.role);
  const { gigs, creators } = useApp();
  const [filter, setFilter] = useState<Filter>("all");

  if (!hydrated || !userId) return <CardSkeleton />;

  const mine = gigs
    .filter((g) => (role === "creator" ? g.creatorId === userId : g.companyId === userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const filtered = (() => {
    if (filter === "active") return mine.filter((g) => ACTIVE_STATUSES.includes(g.status));
    if (filter === "past") return mine.filter((g) => PAST_STATUSES.includes(g.status));
    return mine;
  })();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-4xl font-extrabold leading-[0.95] sm:text-5xl">Gigs</h1>
        <p className="mt-2 text-sm font-bold text-text-secondary">
          Every deal, from first offer to payout.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-full border border-border bg-surface p-1 w-fit">
        {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold transition-all",
              filter === f
                ? "bg-ink text-[#faf6ef]"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {FILTER_LABELS[f]}
            {f !== "all" && (
              <span className={cn("ml-1.5 text-[11px]", filter === f ? "text-[#faf6ef]/60" : "text-text-tertiary")}>
                {f === "active"
                  ? mine.filter((g) => ACTIVE_STATUSES.includes(g.status)).length
                  : mine.filter((g) => PAST_STATUSES.includes(g.status)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={filter === "active" ? "No active gigs" : filter === "past" ? "No past gigs" : "No gigs yet"}
          body={
            filter !== "all"
              ? `Nothing in the ${filter} category yet.`
              : role === "creator"
                ? "Offers from brands appear here. Make sure your profile is set to Open to Work."
                : "Find a creator on Discover and send your first offer."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[16px] border-2 border-ink bg-surface shadow-[3px_3px_0_0_#101805]">
          {filtered.map((g, i) => {
            const other =
              role === "creator"
                ? {
                    name: companyById(g.companyId)?.name ?? "Brand",
                    hue: companyById(g.companyId)?.logoHue ?? 0,
                    src: undefined,
                  }
                : (() => {
                    const c = creators.find((c) => c.id === g.creatorId);
                    return { name: c?.name ?? "Creator", hue: c?.avatarHue ?? 0, src: c?.avatarUrl };
                  })();
            const amount = role === "creator" ? creatorPayoutCents(g.priceCents) : g.priceCents;
            const isPast = PAST_STATUSES.includes(g.status);
            return (
              <Link
                key={g.id}
                href={`/gig/${g.id}`}
                className={cn(
                  "flex items-center gap-3 border-b-2 border-ink/10 px-4 py-4 transition-all last:border-0 hover:-translate-y-0.5",
                  isPast ? "opacity-70 hover:opacity-100" : "hover:bg-surface-2/40",
                )}
              >
                <Avatar name={other.name} hue={other.hue} src={other.src} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{g.title}</p>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
                    <PlatformIcon platform={g.platform} className="h-3 w-3" />
                    {other.name}
                    {" · "}
                    <span className="num">{daysAgo(g.createdAt)}</span>
                  </p>
                </div>
                <span className={cn("num hidden font-serif text-sm font-extrabold sm:block", role === "creator" && "text-money")}>
                  {formatMoney(amount)}
                </span>
                <StatusPill status={g.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
