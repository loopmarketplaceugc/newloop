"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, BadgeCheck, ExternalLink, FileWarning, Landmark, Loader2, Receipt } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { CountUpMoney } from "@/components/shared/count-up";
import { companyById } from "@/lib/seed";
import {
  creatorPayoutCents,
  ESCROW_HELD_STATUSES,
  PLATFORM_FEE_PCT,
  USAGE_REMINDER_DAYS,
} from "@/lib/gig-machine";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { startPayoutOnboarding, refreshPayoutStatus, getExpressDashboardUrl } from "@/lib/payments";
import { haptics } from "@/lib/haptics";

export default function WalletPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const email = useSession((s) => s.email);
  const isDemo = useSession((s) => s.isDemo);
  const { gigs, transactions, creators } = useApp();
  const me = creators.find((c) => c.id === userId);
  const [connecting, setConnecting] = useState(false);
  const [openingDashboard, setOpeningDashboard] = useState(false);

  // Coming back from Stripe payout onboarding — refresh verified status.
  useEffect(() => {
    if (!hydrated || !userId || isDemo) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("payouts") && me?.stripeAccountId) {
      void refreshPayoutStatus({ creatorId: userId, accountId: me.stripeAccountId }).then((ok) => {
        if (ok) {
          useApp.getState().updateCreator(userId, { stripePayoutsEnabled: true });
          haptics.success();
          toast("Payouts active", { body: "You're all set to get paid directly. 🎉", tone: "success" });
        }
      });
      window.history.replaceState({}, "", "/dashboard/wallet");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, userId, isDemo, me?.stripeAccountId]);

  if (!hydrated || !userId) return <CardSkeleton />;

  const myGigs = gigs.filter((g) => g.creatorId === userId);
  const myGigIds = new Set(myGigs.map((g) => g.id));
  const myTx = transactions
    .filter((t) => myGigIds.has(t.gigId) && (t.type === "release" || t.type === "fee"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const released = myTx.filter((t) => t.type === "release").reduce((s, t) => s + t.amountCents, 0);
  const pending = myGigs
    .filter((g) => ESCROW_HELD_STATUSES.includes(g.status))
    .reduce((s, g) => s + creatorPayoutCents(g.priceCents), 0);
  const expiring = myGigs.filter((g) => g.usageExpiresAt && daysUntil(g.usageExpiresAt) > 0);
  const payoutsReady = Boolean(me?.stripePayoutsEnabled);

  const connectPayouts = async () => {
    if (isDemo) {
      toast("Demo mode", { body: "Sign up for a real account to connect payouts.", tone: "info" });
      return;
    }
    setConnecting(true);
    haptics.step();
    try {
      await startPayoutOnboarding({
        creatorId: userId,
        email: email || undefined,
        existingAccountId: me?.stripeAccountId,
      });
    } catch (e) {
      haptics.error();
      setConnecting(false);
      toast("Couldn't start payout setup", {
        body: e instanceof Error ? e.message : "Try again shortly.",
        tone: "warning",
      });
    }
  };

  const openExpressDashboard = async () => {
    if (isDemo || !me?.stripeAccountId) return;
    setOpeningDashboard(true);
    haptics.step();
    try {
      const url = await getExpressDashboardUrl(me.stripeAccountId);
      window.location.href = url;
    } catch (e) {
      haptics.error();
      setOpeningDashboard(false);
      toast("Couldn't open payout dashboard", {
        body: e instanceof Error ? e.message : "Try again shortly.",
        tone: "warning",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold leading-[0.95]">
            Your <span className="text-gradient-ink">money</span>
          </h1>
          <p className="mt-2 text-sm font-bold text-text-secondary">
            Brands pay through MCC escrow. We keep {PLATFORM_FEE_PCT}% — the rest lands in your bank.
          </p>
        </div>
        {payoutsReady && me?.stripeAccountId && (
          <Button
            variant="moneyOutline"
            size="sm"
            onClick={openExpressDashboard}
            disabled={openingDashboard}
          >
            {openingDashboard
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Landmark className="h-4 w-4" />}
            {openingDashboard ? "Opening…" : "Manage payouts"}
            {!openingDashboard && <ExternalLink className="h-3.5 w-3.5 opacity-50" />}
          </Button>
        )}
      </div>

      {/* Payout setup / status */}
      <Card className={payoutsReady ? "border-money/40 bg-money-soft" : "border-ink bg-[#a8d98a]"}>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-ink ${payoutsReady ? "bg-money text-white" : "bg-ink text-[#a8d98a]"}`}>
              {payoutsReady ? <BadgeCheck className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
            </span>
            <div>
              <p className="font-serif text-lg font-extrabold text-ink">
                {payoutsReady ? "Payouts connected via Stripe" : "Connect payouts to get paid"}
              </p>
              <p className="mt-0.5 max-w-md text-sm font-bold text-ink/70">
                {payoutsReady
                  ? `Brand payments hit your bank automatically. MCC keeps ${PLATFORM_FEE_PCT}% — that's it.`
                  : `Set up Stripe Express once. Every future gig pays you directly, minus MCC's ${PLATFORM_FEE_PCT}% cut.`}
              </p>
            </div>
          </div>
          {!payoutsReady && (
            <Button onClick={connectPayouts} disabled={connecting}>
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
              {me?.stripeAccountId ? "Finish payout setup" : "Connect bank account"}
            </Button>
          )}
          {payoutsReady && me?.stripeAccountId && (
            <Button variant="outline" size="sm" onClick={openExpressDashboard} disabled={openingDashboard}>
              {openingDashboard ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              View Stripe dashboard
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Fee breakdown */}
      <Card className="border-ink/20 bg-surface-2">
        <CardContent className="flex flex-wrap items-center gap-6">
          {[
            { label: "Brand pays", pct: 100, color: "text-text-primary" },
            { label: `MCC fee (${PLATFORM_FEE_PCT}%)`, pct: PLATFORM_FEE_PCT, color: "text-[#d6409f]" },
            { label: "You receive", pct: 100 - PLATFORM_FEE_PCT, color: "text-money" },
          ].map(({ label, pct, color }, i) => (
            <div key={label} className="flex items-center gap-3">
              {i > 0 && <span className="text-text-tertiary">→</span>}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">{label}</p>
                <p className={`num font-serif text-2xl font-extrabold ${color}`}>{pct}%</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-ink bg-ink text-[#faf6ef]">
          <CardContent>
            <span className="sticker bg-[#a8d98a] text-[11px] text-ink">paid out</span>
            <CountUpMoney cents={released} className="mt-2 block font-serif text-4xl font-extrabold text-[#a8d98a]" />
            <p className="mt-1 text-xs font-bold text-[#faf6ef]/50">Money already in your pocket</p>
          </CardContent>
        </Card>
        <Card className="bg-[#f2a3df]">
          <CardContent className="text-ink">
            <span className="sticker bg-ink text-[11px] text-[#f2a3df]">on the way</span>
            <p className="num mt-2 font-serif text-4xl font-extrabold">{formatMoney(pending)}</p>
            <p className="mt-1 text-xs font-bold opacity-60">Releases the moment a brand approves your work</p>
          </CardContent>
        </Card>
      </div>

      {expiring.length > 0 && (
        <Card>
          <CardContent>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              Usage rights tracker
            </p>
            <div className="space-y-2">
              {expiring.map((g) => {
                const days = daysUntil(g.usageExpiresAt!);
                return (
                  <div key={g.id} className="flex items-center justify-between gap-3 rounded-[12px] border-2 border-border px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold">{g.title}</p>
                      <p className="text-xs text-text-tertiary">
                        {companyById(g.companyId)?.name} · expires {formatDate(g.usageExpiresAt!)}
                      </p>
                    </div>
                    {days <= USAGE_REMINDER_DAYS ? (
                      <Badge variant="amber">
                        <FileWarning className="h-3 w-3" /> {days}d left — renewal due
                      </Badge>
                    ) : (
                      <Badge>
                        <span className="num">{days}d</span> left
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Transaction history</p>
          {myTx.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              body={`Payouts and MCC's ${PLATFORM_FEE_PCT}% commission show here the moment a brand approves your work.`}
            />
          ) : (
            <div className="divide-y divide-border">
              {myTx.map((t) => {
                const gig = myGigs.find((g) => g.id === t.gigId);
                const isRelease = t.type === "release";
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={isRelease ? "rounded-full bg-money-soft p-1.5 text-money" : "rounded-full bg-surface-2 p-1.5 text-text-tertiary"}>
                      {isRelease ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">
                        {isRelease ? "Payout" : `MCC commission (${PLATFORM_FEE_PCT}%)`} — {gig?.title}
                      </p>
                      <p className="num text-xs text-text-tertiary">
                        {formatDate(t.createdAt)}{t.stripeRef ? ` · ${t.stripeRef}` : ""}
                      </p>
                    </div>
                    <span className={`num text-sm font-bold ${isRelease ? "text-money" : "text-text-tertiary"}`}>
                      {isRelease ? "+" : "−"}{formatMoney(t.amountCents)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
