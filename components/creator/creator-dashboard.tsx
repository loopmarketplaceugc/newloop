"use client";

import Link from "next/link";
import { Briefcase, Clock, FileWarning, Star } from "lucide-react";
import { useApp } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/star-rating";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { EarningsCard } from "./earnings-card";
import { companyById } from "@/lib/seed";
import {
  ACTIVE_STATUSES,
  ESCROW_HELD_STATUSES,
  KANBAN_LANES,
  creatorPayoutCents,
} from "@/lib/gig-machine";
import { daysUntil, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CreatorDashboard() {
  const userId = useSession((s) => s.userId)!;
  const { gigs, transactions, reviews, creators } = useApp();
  const me = creators.find((c) => c.id === userId);
  if (!me) return null;

  const myGigs = gigs.filter((g) => g.creatorId === userId);
  const myGigIds = new Set(myGigs.map((g) => g.id));
  // Real numbers only: everything is derived from actual transactions
  const releaseTxs = transactions.filter((t) => t.type === "release" && myGigIds.has(t.gigId));
  const released = releaseTxs.reduce((s, t) => s + t.amountCents, 0);
  const pendingEscrow = myGigs
    .filter((g) => ESCROW_HELD_STATUSES.includes(g.status))
    .reduce((s, g) => s + creatorPayoutCents(g.priceCents), 0);
  const myReviews = reviews.filter((r) => r.targetId === userId);
  const completedGigs = myGigs.filter((g) => ["PAID_OUT", "COMPLETED"].includes(g.status));
  const activeCount = myGigs.filter((g) => ACTIVE_STATUSES.includes(g.status)).length;

  // Profile completeness drives data quality
  const completeness = [
    { label: "Add a bio", done: me.bio.length > 20 },
    { label: "Link a platform", done: me.platforms.length > 0 },
    { label: "Upload 3+ portfolio pieces", done: me.portfolio.length >= 3 },
    { label: "Upload a media kit", done: !!me.mediaKitUrl },
    { label: "Set your rates", done: me.baseRateCents > 0 },
  ];
  const doneCount = completeness.filter((c) => c.done).length;
  const pct = Math.round((doneCount / completeness.length) * 100);

  const slotsPct = Math.min(100, (me.slotsBooked / me.capacityPerWeek) * 100);
  const expiring = myGigs
    .filter((g) => g.usageExpiresAt && daysUntil(g.usageExpiresAt) > 0)
    .sort((a, b) => daysUntil(a.usageExpiresAt!) - daysUntil(b.usageExpiresAt!))[0];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Good to see you, {me.name.split(" ")[0]}</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            <span className="num">{activeCount}</span> active gig{activeCount === 1 ? "" : "s"} ·{" "}
            <span className="num">{me.slotsBooked}</span> of <span className="num">{me.capacityPerWeek}</span> weekly slots booked
          </p>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <EarningsCard releases={releaseTxs} />

        {/* Escrow card */}
        <Card>
          <CardContent className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Escrow</p>
              <div className="mt-3 space-y-4">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="num text-2xl font-semibold">{formatMoney(pendingEscrow)}</span>
                    <Badge variant="amber">Pending</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-text-tertiary">Held until brands approve</p>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="num text-2xl font-semibold text-money">{formatMoney(released)}</span>
                    <Badge variant="money">Released</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-text-tertiary">Paid out this period · 10% fee deducted</p>
                </div>
              </div>
            </div>
            {expiring?.usageExpiresAt && (
              <p className="rounded-[8px] border border-border bg-surface-2 px-3 py-2 text-xs leading-relaxed text-text-secondary">
                <FileWarning className="mr-1 inline h-3.5 w-3.5 text-amber" />
                Usage rights on “{expiring.title}” expire in{" "}
                <span className="num font-semibold">{daysUntil(expiring.usageExpiresAt)}d</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active gigs kanban */}
        <Card className="md:col-span-2">
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Active gigs</p>
              <Link href="/dashboard/gigs" className="text-xs font-medium text-text-secondary hover:text-text-primary">
                View all →
              </Link>
            </div>
            {activeCount === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No active gigs"
                body="When a brand sends you an offer, it lands here. Keep your profile fresh to get matched."
              />
            ) : (
              <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
                {KANBAN_LANES.map((lane) => {
                  const laneGigs = myGigs.filter((g) => lane.statuses.includes(g.status) && g.status !== "COMPLETED");
                  return (
                    <div key={lane.label} className="w-36 shrink-0 rounded-[8px] bg-surface-2/60 p-2">
                      <p className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium text-text-tertiary">
                        {lane.label} <span className="num">{laneGigs.length}</span>
                      </p>
                      <div className="space-y-1.5">
                        {laneGigs.map((g) => (
                          <Link
                            key={g.id}
                            href={`/gig/${g.id}`}
                            className="block rounded-[8px] border border-border bg-surface p-2.5 transition-colors hover:border-border-bright"
                          >
                            <p className="line-clamp-2 text-xs font-medium leading-snug">{g.title}</p>
                            <p className="num mt-1.5 text-xs font-semibold text-money">
                              {formatMoney(creatorPayoutCents(g.priceCents))}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Capacity meter */}
        <Card>
          <CardContent className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="self-start text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              Weekly capacity
            </p>
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="var(--color-money)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(slotsPct / 100) * 263.9} 263.9`}
                />
              </svg>
              <div className="absolute text-center">
                <p className="num text-xl font-semibold">
                  {me.slotsBooked}<span className="text-text-tertiary">/{me.capacityPerWeek}</span>
                </p>
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary">slots</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary">
              {me.slotsBooked >= me.capacityPerWeek
                ? "Fully booked this week — brands see you as Busy."
                : `${me.capacityPerWeek - me.slotsBooked} slot${me.capacityPerWeek - me.slotsBooked === 1 ? "" : "s"} open this week`}
            </p>
          </CardContent>
        </Card>

        {/* Partnership history */}
        <Card className={cn(pct === 100 ? "md:col-span-3" : "md:col-span-2")}>
          <CardContent>
            <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              Partnership history
            </p>
            {completedGigs.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No completed gigs yet"
                body="Finish your first gig and your brand history — with ratings — shows up here."
              />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {completedGigs.map((g) => {
                  const co = companyById(g.companyId);
                  const review = myReviews.find((r) => r.gigId === g.id);
                  return (
                    <Link
                      key={g.id}
                      href={`/gig/${g.id}`}
                      className="group flex items-center gap-3 rounded-[8px] border border-border p-3 transition-colors hover:border-border-bright hover:bg-surface-2/40"
                    >
                      <Avatar name={co?.name ?? "?"} hue={co?.logoHue ?? 0} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{co?.name}</p>
                        <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
                          <PlatformIcon platform={g.platform} className="h-3 w-3" />
                          {g.title.length > 28 ? g.title.slice(0, 28) + "…" : g.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="num text-[13px] font-semibold text-money">
                          {formatMoney(creatorPayoutCents(g.priceCents))}
                        </p>
                        {review ? (
                          <StarRating rating={review.rating} />
                        ) : (
                          <span className="text-[11px] text-text-tertiary">awaiting review</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile completeness */}
        {pct < 100 && (
          <Card>
            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  Profile strength
                </p>
                <span className="num text-sm font-semibold">{pct}%</span>
              </div>
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-text-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <ul className="space-y-2">
                {completeness.map((c) => (
                  <li key={c.label} className="flex items-center gap-2 text-[13px]">
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border text-[9px]",
                        c.done
                          ? "border-money bg-money text-white"
                          : "border-border-bright text-transparent",
                      )}
                    >
                      ✓
                    </span>
                    <span className={c.done ? "text-text-tertiary line-through" : "text-text-secondary"}>
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/profile"
                className="mt-4 inline-block text-xs font-medium text-text-primary underline underline-offset-2"
              >
                Complete your profile →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
