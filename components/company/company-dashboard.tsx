"use client";

import Link from "next/link";
import { Briefcase, Compass, FileText, Hourglass, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { companyById } from "@/lib/seed";
import { ACTIVE_STATUSES, AUTO_APPROVE_DAYS, ESCROW_HELD_STATUSES } from "@/lib/gig-machine";
import { daysUntil, formatMoney } from "@/lib/format";

export function CompanyDashboard() {
  const userId = useSession((s) => s.userId)!;
  const { gigs, creators, transactions, scripts } = useApp();
  const company = companyById(userId);

  const myGigs = gigs.filter((g) => g.companyId === userId);
  const active = myGigs.filter((g) => ACTIVE_STATUSES.includes(g.status));
  const inEscrow = myGigs
    .filter((g) => ESCROW_HELD_STATUSES.includes(g.status))
    .reduce((s, g) => s + g.priceCents, 0);
  const spent = transactions
    .filter((t) => t.type === "fund" && myGigs.some((g) => g.id === t.gigId))
    .reduce((s, t) => s + t.amountCents, 0);
  const awaitingReview = myGigs.filter((g) => g.status === "DELIVERED");
  const myScripts = scripts.filter((s) => s.companyId === userId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">{company?.name ?? "Your brand"}</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            <span className="num">{active.length}</span> active gig{active.length === 1 ? "" : "s"} ·{" "}
            <span className="num">{formatMoney(inEscrow)}</span> in escrow
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="aiOutline" size="sm">
            <Link href="/dashboard/scripts?new=1">
              <Sparkles className="h-4 w-4" /> New AI script
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/discover">
              <Compass className="h-4 w-4" /> Find creators
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">In escrow</p>
            <p className="num mt-1 text-3xl font-semibold">{formatMoney(inEscrow)}</p>
            <p className="mt-1 text-xs text-text-tertiary">Released only when you approve</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Total funded</p>
            <p className="num mt-1 text-3xl font-semibold">{formatMoney(spent)}</p>
            <p className="mt-1 text-xs text-text-tertiary">Across {myGigs.length} gigs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Scripts generated</p>
            <p className="num mt-1 text-3xl font-semibold">{myScripts.length}</p>
            <p className="mt-1 text-xs text-text-tertiary">
              <Link href="/dashboard/scripts" className="underline underline-offset-2">Open library</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {awaitingReview.length > 0 && (
        <Card className="border-amber/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Hourglass className="h-5 w-5 text-amber" />
              <div>
                <p className="text-sm font-medium">
                  {awaitingReview.length} deliverable{awaitingReview.length === 1 ? "" : "s"} waiting on your review
                </p>
                <p className="text-xs text-text-secondary">
                  Unreviewed work auto-approves {AUTO_APPROVE_DAYS} days after delivery — creators don&apos;t wait on silence.
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={`/gig/${awaitingReview[0].id}`}>Review now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Active gigs</p>
          {active.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No active gigs"
              body="Find a creator, send an offer, and your gigs will line up here with live escrow status."
              action={
                <Button asChild size="sm">
                  <Link href="/dashboard/discover">Browse creators</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {active.map((g) => {
                const creator = creators.find((c) => c.id === g.creatorId);
                return (
                  <Link
                    key={g.id}
                    href={`/gig/${g.id}`}
                    className="flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-surface-2/30"
                  >
                    <Avatar name={creator?.name ?? "?"} hue={creator?.avatarHue ?? 0} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{g.title}</p>
                      <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
                        <PlatformIcon platform={g.platform} className="h-3 w-3" />
                        {creator?.name}
                        {g.deadline && daysUntil(g.deadline) > 0 && (
                          <> · due in <span className="num">{daysUntil(g.deadline)}d</span></>
                        )}
                      </p>
                    </div>
                    <span className="num hidden text-sm font-semibold sm:block">{formatMoney(g.priceCents)}</span>
                    <StatusPill status={g.status} />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {myScripts.length > 0 && (
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Recent scripts</p>
              <Link href="/dashboard/scripts" className="text-xs font-medium text-text-secondary hover:text-text-primary">
                View all →
              </Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {myScripts.slice(0, 3).map((s) => (
                <Link
                  key={s.id}
                  href="/dashboard/scripts"
                  className="rounded-[8px] border border-border p-3 transition-colors hover:border-ai/40"
                >
                  <FileText className="h-4 w-4 text-ai" />
                  <p className="mt-2 line-clamp-1 text-[13px] font-medium">{s.output.title}</p>
                  <p className="mt-0.5 text-xs capitalize text-text-tertiary">
                    {s.inputs.tone} · {s.output.kind === "script" ? "Full script" : "Brief"}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
