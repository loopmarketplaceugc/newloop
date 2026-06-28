"use client";

import Link from "next/link";
import { Briefcase, Compass, Hourglass } from "lucide-react";
import { useApp } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { companyById } from "@/lib/seed";
import { ACTIVE_STATUSES, AUTO_APPROVE_DAYS, ESCROW_HELD_STATUSES } from "@/lib/gig-machine";
import type { GigStatus } from "@/lib/types";
import { daysUntil, formatMoney } from "@/lib/format";

const PAST_STATUSES: GigStatus[] = ["COMPLETED", "EXPIRED", "PAID_OUT", "CANCELLED"];

export function CompanyDashboard() {
  const userId = useSession((s) => s.userId)!;
  const sessionName = useSession((s) => s.name);
  const isDemo = useSession((s) => s.isDemo);
  const { gigs, creators, transactions } = useApp();
  const company = isDemo ? companyById(userId) : undefined;
  const brandName = sessionName || company?.name || "Your brand";

  const myGigs = gigs.filter((g) => g.companyId === userId);
  const active = myGigs.filter((g) => ACTIVE_STATUSES.includes(g.status));
  const past = myGigs
    .filter((g) => PAST_STATUSES.includes(g.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const inEscrow = myGigs
    .filter((g) => ESCROW_HELD_STATUSES.includes(g.status))
    .reduce((s, g) => s + g.priceCents, 0);
  const spent = transactions
    .filter((t) => t.type === "fund" && myGigs.some((g) => g.id === t.gigId))
    .reduce((s, t) => s + t.amountCents, 0);
  const awaitingReview = myGigs.filter((g) => g.status === "DELIVERED");

  return (
    <div className="space-y-5">
      {/* Hero greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-extrabold leading-[0.95] sm:text-6xl">
            {brandName}
            <span className="text-[#d6409f]">.</span>
          </h1>
          <p className="mt-2 font-bold text-text-secondary">
            <span className="num">{active.length}</span> active gig{active.length === 1 ? "" : "s"} ·{" "}
            <span className="num">{formatMoney(inEscrow)}</span> secured
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/dashboard/discover"
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-serif text-sm font-bold text-[#a8d98a] transition-all hover:scale-105"
          >
            <Compass className="h-4 w-4" /> Find creators
          </Link>
        </div>
      </div>

      {/* Stat cards — pink / ink / lime */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card className="bg-[#f2a3df]">
          <CardContent className="text-ink">
            <span className="sticker bg-ink text-[11px] text-[#f2a3df]">secured</span>
            <p className="num mt-2 font-serif text-4xl font-extrabold">{formatMoney(inEscrow)}</p>
            <p className="mt-1 text-xs font-bold opacity-60">creator payments in motion</p>
          </CardContent>
        </Card>
        <Card className="border-ink bg-ink">
          <CardContent className="text-[#faf6ef]">
            <span className="sticker bg-[#a8d98a] text-[11px] text-ink">total funded</span>
            <p className="num mt-2 font-serif text-4xl font-extrabold text-[#a8d98a]">{formatMoney(spent)}</p>
            <p className="mt-1 text-xs font-bold text-[#faf6ef]/50">
              across <span className="num">{myGigs.length}</span> gig{myGigs.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#a8d98a]">
          <CardContent className="text-ink">
            <span className="sticker bg-ink text-[11px] text-[#a8d98a]">completed</span>
            <p className="num mt-2 font-serif text-4xl font-extrabold">{past.length}</p>
            <p className="mt-1 text-xs font-bold opacity-60">
              <Link href="/dashboard/gigs" className="underline underline-offset-2">view all gigs →</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Review nudge */}
      {awaitingReview.length > 0 && (
        <Card className="bg-bg">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 animate-wiggle items-center justify-center rounded-full bg-[#f2a3df] text-ink">
                <Hourglass className="h-5 w-5" />
              </span>
              <div>
                <p className="font-serif text-base font-extrabold">
                  {awaitingReview.length} deliverable{awaitingReview.length === 1 ? "" : "s"} waiting on you
                </p>
                <p className="text-xs font-bold text-text-secondary">
                  silence auto-approves in {AUTO_APPROVE_DAYS} days — creators don&apos;t wait on ghosts
                </p>
              </div>
            </div>
            <Link
              href={`/gig/${awaitingReview[0].id}`}
              className="rounded-full bg-ink px-5 py-2.5 font-serif text-sm font-bold text-[#f2a3df] transition-transform hover:scale-105"
            >
              Review now →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Active gigs */}
      <Card>
        <CardContent>
          <p className="mb-4 font-serif text-lg font-extrabold">Active gigs</p>
          {active.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No active gigs"
              body="Find a creator, send an offer, and every payment, file, and deadline stays attached."
              action={
                <Link href="/dashboard/discover" className="rounded-full bg-ink px-5 py-2.5 font-serif text-sm font-bold text-[#a8d98a] transition-transform hover:scale-105">
                  Browse creators →
                </Link>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {active.map((g) => {
                const creator = creators.find((c) => c.id === g.creatorId);
                return (
                  <Link
                    key={g.id}
                    href={`/gig/${g.id}`}
                    className="flex items-center gap-3 rounded-[14px] border-2 border-ink p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_#101805]"
                  >
                    <Avatar name={creator?.name ?? "?"} hue={creator?.avatarHue ?? 0} src={creator?.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{g.title}</p>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
                        <PlatformIcon platform={g.platform} className="h-3 w-3" />
                        {creator?.name}
                        {g.deadline && daysUntil(g.deadline) > 0 && (
                          <> · due in <span className="num">{daysUntil(g.deadline)}d</span></>
                        )}
                      </p>
                    </div>
                    <span className="num hidden font-serif text-base font-extrabold sm:block">{formatMoney(g.priceCents)}</span>
                    <StatusPill status={g.status} />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past gigs */}
      {past.length > 0 && (
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-serif text-lg font-extrabold">Past gigs</p>
              {past.length > 5 && (
                <Link href="/dashboard/gigs" className="rounded-full border-2 border-ink px-3.5 py-1 text-xs font-bold transition-all hover:scale-105 hover:bg-ink hover:text-[#f2a3df]">
                  view all →
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {past.slice(0, 5).map((g) => {
                const creator = creators.find((c) => c.id === g.creatorId);
                return (
                  <Link
                    key={g.id}
                    href={`/gig/${g.id}`}
                    className="flex items-center gap-3 rounded-[14px] border border-ink/10 p-3.5 opacity-70 transition-all hover:opacity-100 hover:border-ink/30 hover:bg-surface-2/30"
                  >
                    <Avatar name={creator?.name ?? "?"} hue={creator?.avatarHue ?? 0} src={creator?.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{g.title}</p>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
                        <PlatformIcon platform={g.platform} className="h-3 w-3" />
                        {creator?.name ?? "Creator"}
                      </p>
                    </div>
                    <span className="num hidden font-serif text-sm font-extrabold text-text-secondary sm:block">{formatMoney(g.priceCents)}</span>
                    <StatusPill status={g.status} />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
