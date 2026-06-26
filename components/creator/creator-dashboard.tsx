"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  CircleDollarSign,
  Compass,
  FileWarning,
  Star,
  Wallet,
} from "lucide-react";
import { useApp } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/star-rating";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { QrCode } from "@/components/shared/qr-code";
import { EarningsCard } from "./earnings-card";
import { IdeaChat } from "./idea-chat";
import { CreatorTour } from "./creator-tour";
import { companyById } from "@/lib/seed";
import {
  ACTIVE_STATUSES,
  ESCROW_HELD_STATUSES,
  KANBAN_LANES,
  creatorPayoutCents,
} from "@/lib/gig-machine";
import { daysUntil, formatMoney } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import type { Creator } from "@/lib/types";

function firstRunCreator(id: string, name: string): Creator {
  return {
    id,
    handle: "creator",
    name: name || "Creator",
    avatarHue: 285,
    bio: "",
    location: "",
    status: "open",
    tier: "nano",
    platforms: [],
    niches: [],
    baseRateCents: 0,
    usageUpchargePct: 30,
    rawUpchargePct: 40,
    capacityPerWeek: 3,
    slotsBooked: 0,
    compensationPref: "product_plus",
    rating: 0,
    reviewCount: 0,
    completedGigs: 0,
    portfolio: [],
    joinedAt: new Date().toISOString(),
  };
}

export function CreatorDashboard() {
  const userId = useSession((s) => s.userId)!;
  const sessionName = useSession((s) => s.name);
  const { gigs, transactions, reviews, creators } = useApp();
  const me = creators.find((c) => c.id === userId) ?? firstRunCreator(userId, sessionName);

  const myGigs = gigs.filter((g) => g.creatorId === userId);
  const myGigIds = new Set(myGigs.map((g) => g.id));
  // Real numbers only: everything is derived from actual transactions
  const releaseTxs = transactions.filter((t) => t.type === "release" && myGigIds.has(t.gigId));
  const released = releaseTxs.reduce((s, t) => s + t.amountCents, 0);
  const pendingPayout = myGigs
    .filter((g) => ESCROW_HELD_STATUSES.includes(g.status))
    .reduce((s, g) => s + creatorPayoutCents(g.priceCents), 0);
  const myReviews = reviews.filter((r) => r.targetId === userId);
  const completedGigs = myGigs.filter((g) => ["PAID_OUT", "COMPLETED"].includes(g.status));
  const activeCount = myGigs.filter((g) => ACTIVE_STATUSES.includes(g.status)).length;

  const completeness = [
    { label: "Add a bio", done: me.bio.length > 20 },
    { label: "Link a platform", done: me.platforms.length > 0 },
    { label: "Upload 3+ portfolio pieces", done: me.portfolio.length >= 3 },
    { label: "Upload a media kit", done: !!me.mediaKitUrl },
    { label: "Set your rates", done: me.baseRateCents > 0 },
  ];
  const doneCount = completeness.filter((c) => c.done).length;
  const pct = Math.round((doneCount / completeness.length) * 100);
  const firstName = me.name.trim().split(/\s+/)[0] || "creator";

  const slotsPct = me.capacityPerWeek > 0 ? Math.min(100, (me.slotsBooked / me.capacityPerWeek) * 100) : 0;
  const expiring = myGigs
    .filter((g) => g.usageExpiresAt && daysUntil(g.usageExpiresAt) > 0)
    .sort((a, b) => daysUntil(a.usageExpiresAt!) - daysUntil(b.usageExpiresAt!))[0];

  // "Due soon": active gigs with an upcoming deadline, soonest first.
  const dueSoon = myGigs
    .filter((g) => g.deadline && ACTIVE_STATUSES.includes(g.status))
    .sort((a, b) => daysUntil(a.deadline!) - daysUntil(b.deadline!))
    .slice(0, 4);

  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <div className="space-y-5">
      <CreatorTour />

      {/* Hero greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-extrabold leading-[0.95] sm:text-6xl">
            Hey, <span className="text-gradient-ink">{firstName}</span>
            <span className="text-[#d6409f]">.</span>
          </h1>
          <p className="mt-2 font-bold text-text-secondary">
            <span className="num">{activeCount}</span> active gig{activeCount === 1 ? "" : "s"} ·{" "}
            <span className="num">{me.slotsBooked}</span>/<span className="num">{me.capacityPerWeek}</span> weekly slots booked
            {me.status === "open" && (
              <span className="sticker ml-3 bg-[#a8d98a] text-xs text-ink">open to work</span>
            )}
          </p>
          {me.loopTag && (
            <p className="num mt-2 inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-surface px-3 py-1 text-xs font-bold text-text-secondary">
              <span className="text-[#d6409f]">●</span> Loop tag: <span className="font-extrabold text-text-primary">{me.loopTag}</span>
            </p>
          )}
        </div>
        <Link
          href="/dashboard/opportunities"
          onClick={() => haptics.select()}
          className="flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-serif text-base font-bold text-[#faf6ef] transition-transform hover:scale-105"
        >
          <Compass className="h-5 w-5 text-[#a8d98a]" /> Find opportunities
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Bento grid */}
      <div className="grid gap-5 md:grid-cols-3">
        <EarningsCard releases={releaseTxs} />

        {/* Payment card — pink */}
        <Card className="bg-[#f2a3df]">
          <CardContent className="flex h-full flex-col justify-between gap-4 text-ink">
            <div>
              <p className="flex items-center gap-2 font-serif text-lg font-extrabold">
                <CircleDollarSign className="h-5 w-5" /> Payments
              </p>
              <div className="mt-4 space-y-5">
                <div>
                  <span className="sticker bg-ink text-[11px] text-[#f2a3df]">secured</span>
                  <p className="num mt-1.5 font-serif text-3xl font-extrabold">{formatMoney(pendingPayout)}</p>
                  <p className="text-xs font-bold opacity-60">brand-paid work in progress</p>
                </div>
                <div>
                  <span className="sticker bg-money text-[11px] text-white">released</span>
                  <p className="num mt-1.5 font-serif text-3xl font-extrabold">{formatMoney(released)}</p>
                  <p className="text-xs font-bold opacity-60">approved work paid to you</p>
                </div>
              </div>
            </div>
            {expiring?.usageExpiresAt && (
              <p className="rounded-[14px] border-2 border-ink bg-bg px-3 py-2 text-xs font-bold leading-relaxed">
                <FileWarning className="mr-1 inline h-3.5 w-3.5" />
                Usage rights on “{expiring.title.slice(0, 26)}…” expire in{" "}
                <span className="num">{daysUntil(expiring.usageExpiresAt)}d</span>
              </p>
            )}
          </CardContent>
        </Card>


        {/* Due soon */}
        <Card className="md:col-span-3">
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 font-serif text-lg font-extrabold">
                <CalendarClock className="h-5 w-5 text-[#d6409f]" /> Due soon
              </p>
              <Link href="/dashboard/gigs" className="rounded-full border-2 border-ink px-3.5 py-1 text-xs font-bold transition-all hover:scale-105 hover:bg-ink hover:text-[#a8d98a]">
                all gigs →
              </Link>
            </div>
            {dueSoon.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing due"
                body="Deadlines from your active gigs show up here so you never miss a delivery date."
              />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {dueSoon.map((g) => {
                  const days = daysUntil(g.deadline!);
                  const urgent = days <= 2;
                  return (
                    <Link
                      key={g.id}
                      href={`/gig/${g.id}`}
                      className="rounded-[14px] border-2 border-ink p-3 transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#101805]"
                    >
                      <p className="line-clamp-2 text-xs font-bold leading-snug">{g.title}</p>
                      <p className={cn("num mt-2 text-sm font-extrabold", urgent ? "text-[#d6409f]" : "text-text-secondary")}>
                        {days <= 0 ? "due today" : `${days}d left`}
                      </p>
                      <p className="num mt-0.5 text-xs font-bold text-money">{formatMoney(creatorPayoutCents(g.priceCents))}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loop tag certificate */}
        {me.loopTag && (
          <Card className="bg-[#f2a3df] md:col-span-1">
            <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center text-ink">
              <span className="sticker bg-ink text-[11px] text-[#f2a3df]">certified</span>
              <QrCode value={`${origin}/creator/${me.loopTag}`} size={120} label={`Loop tag ${me.loopTag}`} />
              <p className="num font-serif text-lg font-extrabold">{me.loopTag}</p>
              <p className="text-xs font-bold opacity-70">Brands scan this to open your verified profile.</p>
            </CardContent>
          </Card>
        )}

        <Card className={cn("border-ink bg-[#a8d98a]", me.loopTag ? "md:col-span-2" : "md:col-span-3")}>
          <CardContent className="flex h-full flex-col justify-between gap-5 text-ink sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <span className="sticker bg-ink text-[11px] text-[#a8d98a]">
                  {me.stripePayoutsEnabled ? "payouts live" : "payout setup"}
                </span>
              </div>
              <h2 className="mt-3 font-serif text-3xl font-extrabold leading-none">
                {me.stripePayoutsEnabled ? "Stripe is connected." : "Connect Stripe to get paid."}
              </h2>
              <p className="mt-2 max-w-xl text-sm font-bold leading-relaxed text-ink/70">
                Brands pay through Loop and your earnings land in your account automatically once the work is approved.
              </p>
            </div>
            <Link
              href="/dashboard/wallet"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-serif text-sm font-bold text-[#a8d98a] transition-transform hover:scale-105"
            >
              {me.stripePayoutsEnabled ? "View wallet" : "Connect payouts"} <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Active gigs kanban */}
        <Card className="md:col-span-2">
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-serif text-lg font-extrabold">Active gigs</p>
              </div>
              <Link href="/dashboard/gigs" className="rounded-full border-2 border-ink px-3.5 py-1 text-xs font-bold transition-all hover:scale-105 hover:bg-ink hover:text-[#a8d98a]">
                view all →
              </Link>
            </div>
            {activeCount === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No active gigs"
                body="When a brand sends you an offer, it lands here. Keep your profile fresh to get matched."
              />
            ) : (
              <div className="-mx-1 flex gap-2.5 overflow-x-auto pb-1">
                {KANBAN_LANES.map((lane, li) => {
                  const laneGigs = myGigs.filter((g) => lane.statuses.includes(g.status) && g.status !== "COMPLETED");
                  const laneTints = ["#f2a3df", "#a8d98a", "#101805", "#f2a3df", "#a8d98a"];
                  return (
                    <div key={lane.label} className="w-40 shrink-0">
                      <p
                        className="mb-2 flex items-center justify-between rounded-full border-2 border-ink px-3 py-1 text-[11px] font-bold"
                        style={{
                          background: laneTints[li],
                          color: laneTints[li] === "#101805" ? "#faf6ef" : "#101805",
                        }}
                      >
                        {lane.label} <span className="num">{laneGigs.length}</span>
                      </p>
                      <div className="space-y-2">
                        {laneGigs.map((g) => (
                          <Link
                            key={g.id}
                            href={`/gig/${g.id}`}
                            className="block rounded-[14px] border-2 border-ink bg-bg p-3 transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#101805]"
                          >
                            <p className="line-clamp-2 text-xs font-bold leading-snug">{g.title}</p>
                            <p className="num mt-1.5 text-sm font-extrabold text-money">
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

        {/* Capacity meter — lime */}
        <Card className="bg-[#a8d98a]">
          <CardContent className="flex h-full flex-col items-center justify-center gap-3 text-center text-ink">
            <p className="self-start font-serif text-lg font-extrabold">This week</p>
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#101805" strokeOpacity="0.15" strokeWidth="11" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="#101805" strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={`${(slotsPct / 100) * 263.9} 263.9`}
                />
              </svg>
              <div className="absolute text-center">
                <p className="num font-serif text-2xl font-extrabold">
                  {me.slotsBooked}<span className="opacity-50">/{me.capacityPerWeek}</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">slots</p>
              </div>
            </div>
            <p className="text-xs font-bold opacity-70">
              {me.slotsBooked >= me.capacityPerWeek
                ? "Fully booked — brands see you as Busy."
                : `${me.capacityPerWeek - me.slotsBooked} slot${me.capacityPerWeek - me.slotsBooked === 1 ? "" : "s"} open for new gigs`}
            </p>
          </CardContent>
        </Card>

        {/* Partnership history */}
        <Card className={cn(pct === 100 ? "md:col-span-3" : "md:col-span-2")}>
          <CardContent>
            <p className="mb-4 font-serif text-lg font-extrabold">Partnership history</p>
            {completedGigs.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No completed gigs yet"
                body="Finish your first gig and your brand history — with ratings — shows up here."
              />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {completedGigs.map((g) => {
                  const co = companyById(g.companyId);
                  const review = myReviews.find((r) => r.gigId === g.id);
                  return (
                    <Link
                      key={g.id}
                      href={`/gig/${g.id}`}
                      className="flex items-center gap-3 rounded-[14px] border-2 border-ink p-3 transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#101805]"
                    >
                      <Avatar name={co?.name ?? "?"} hue={co?.logoHue ?? 0} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold">{co?.name}</p>
                        <p className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
                          <PlatformIcon platform={g.platform} className="h-3 w-3" />
                          {g.title.length > 26 ? g.title.slice(0, 26) + "…" : g.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="num text-sm font-extrabold text-money">
                          {formatMoney(creatorPayoutCents(g.priceCents))}
                        </p>
                        {review ? (
                          <StarRating rating={review.rating} />
                        ) : (
                          <span className="text-[11px] font-bold text-text-tertiary">awaiting review</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile strength — ink */}
        {pct < 100 && (
          <Card className="border-ink bg-ink text-[#faf6ef]">
            <CardContent>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-serif text-lg font-extrabold text-[#f2a3df]">Profile strength</p>
                <span className="num font-serif text-xl font-extrabold text-[#a8d98a]">{pct}%</span>
              </div>
              <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-[#faf6ef]/15">
                <div className="h-full rounded-full bg-[#a8d98a] transition-all" style={{ width: `${pct}%` }} />
              </div>
              <ul className="space-y-2.5">
                {completeness.map((c) => (
                  <li key={c.label} className="flex items-center gap-2.5 text-[13px] font-bold">
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                        c.done ? "bg-[#a8d98a] text-ink" : "border-2 border-[#faf6ef]/25 text-transparent",
                      )}
                    >
                      ✓
                    </span>
                    <span className={c.done ? "text-[#faf6ef]/40 line-through" : "text-[#faf6ef]/90"}>
                      {c.label}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard/profile"
                className="mt-5 inline-block rounded-full bg-[#f2a3df] px-5 py-2 text-sm font-bold text-ink transition-transform hover:scale-105"
              >
                Finish your profile →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
