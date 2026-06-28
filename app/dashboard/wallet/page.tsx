"use client";

import { useState } from "react";
import { ArrowDownLeft, BadgeCheck, ExternalLink, FileWarning, Landmark, Loader2, Receipt } from "lucide-react";
import {
  loadConnectAndInitialize,
  type StripeConnectInstance,
} from "@stripe/connect-js";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
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
  USAGE_REMINDER_DAYS,
} from "@/lib/gig-machine";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { DEV_PAYMENTS, refreshPayoutStatus, getExpressDashboardUrl } from "@/lib/payments";
import { haptics } from "@/lib/haptics";

export default function WalletPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const email = useSession((s) => s.email);
  const isDemo = useSession((s) => s.isDemo);
  const { gigs, transactions, creators } = useApp();
  const me = creators.find((c) => c.id === userId);
  const [openingDashboard, setOpeningDashboard] = useState(false);
  const [connectInstance, setConnectInstance] = useState<StripeConnectInstance | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  if (!hydrated || !userId) return <CardSkeleton />;

  const myGigs = gigs.filter((g) => g.creatorId === userId);
  const myGigIds = new Set(myGigs.map((g) => g.id));
  const myTx = transactions
    .filter((t) => myGigIds.has(t.gigId) && t.type === "release")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const released = myTx.filter((t) => t.type === "release").reduce((s, t) => s + t.amountCents, 0);
  const pending = myGigs
    .filter((g) => ESCROW_HELD_STATUSES.includes(g.status))
    .reduce((s, g) => s + creatorPayoutCents(g.priceCents), 0);
  const expiring = myGigs.filter((g) => g.usageExpiresAt && daysUntil(g.usageExpiresAt) > 0);
  const payoutsReady = Boolean(me?.stripePayoutsEnabled);

  const fetchAccountSession = async (accountId?: string) => {
    const res = await fetch("/api/stripe/account-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ creatorId: userId, email: email || undefined, accountId }),
    });
    const data = (await res.json()) as { clientSecret?: string; accountId?: string; error?: string };
    if (!data.clientSecret) throw new Error(data.error ?? "Could not start payout setup.");
    return data;
  };

  const startEmbeddedConnect = async () => {
    if (isDemo) {
      toast("Demo mode", { body: "Sign up for a real account to connect payouts.", tone: "info" });
      return;
    }
    if (DEV_PAYMENTS) {
      setConnectLoading(true);
      await new Promise<void>((r) => setTimeout(r, 800));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useApp.getState().updateCreator(userId, { stripePayoutsEnabled: true, stripeAccountId: "dev_acct_loop" } as any);
      haptics.success();
      toast("Dev mode — payouts simulated", { body: "No real bank account connected.", tone: "info" });
      setConnectLoading(false);
      return;
    }
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
    if (!pk) {
      toast("Payments not configured", { tone: "warning" });
      return;
    }
    setConnectLoading(true);
    haptics.step();
    try {
      // Pre-flight: surface real Stripe errors before the embedded component mounts.
      const initial = await fetchAccountSession(me?.stripeAccountId);
      if (initial.accountId && !me?.stripeAccountId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useApp.getState().updateCreator(userId, { stripeAccountId: initial.accountId } as any);
      }

      let firstSecret: string | null = initial.clientSecret!;
      const resolvedAccountId = initial.accountId ?? me?.stripeAccountId;

      const instance = loadConnectAndInitialize({
        publishableKey: pk,
        fetchClientSecret: async () => {
          if (firstSecret) {
            const s = firstSecret;
            firstSecret = null;
            return s;
          }
          // Session expired — fetch a fresh one.
          const d = await fetchAccountSession(resolvedAccountId);
          return d.clientSecret!;
        },
        appearance: {
          overlays: "dialog",
          variables: { colorPrimary: "#f2a3df", fontFamily: "system-ui, sans-serif" },
        },
      });
      setConnectInstance(instance);
    } catch (e) {
      haptics.error();
      toast("Couldn't start payout setup", {
        body: e instanceof Error ? e.message : "Try again shortly.",
        tone: "warning",
      });
    } finally {
      setConnectLoading(false);
    }
  };

  const openExpressDashboard = async () => {
    if (isDemo || !me?.stripeAccountId) return;
    setOpeningDashboard(true);
    haptics.step();
    try {
      const url = await getExpressDashboardUrl();
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
            Brand payments land in your bank automatically once approved.
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
                  ? "Brand payments hit your bank automatically via Stripe."
                  : "Connect once — every brand payment goes straight to your bank via Stripe."}
              </p>
            </div>
          </div>
          {!payoutsReady && !connectInstance && (
            <Button onClick={() => void startEmbeddedConnect()} disabled={connectLoading}>
              {connectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
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

      {connectInstance && (
        <ConnectComponentsProvider connectInstance={connectInstance}>
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-[inherit]">
              <ConnectAccountOnboarding
                onLoadError={({ error }) => {
                  toast("Stripe Connect error", {
                    body: error.message ?? error.type ?? "Authentication failed",
                    tone: "warning",
                  });
                  setConnectInstance(null);
                }}
                onExit={() => {
                  setConnectInstance(null);
                  if (userId) {
                    void refreshPayoutStatus({ creatorId: userId, accountId: me?.stripeAccountId ?? "" }).then((ok) => {
                      if (ok) {
                        useApp.getState().updateCreator(userId, { stripePayoutsEnabled: true });
                        haptics.success();
                        toast("Payouts active", { body: "You're all set to get paid directly.", tone: "success" });
                      }
                    });
                  }
                }}
              />
            </CardContent>
          </Card>
        </ConnectComponentsProvider>
      )}

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
              body="Payouts show here the moment a brand approves your work."
            />
          ) : (
            <div className="divide-y divide-border">
              {myTx.map((t) => {
                const gig = myGigs.find((g) => g.id === t.gigId);
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="rounded-full bg-money-soft p-1.5 text-money">
                      <ArrowDownLeft className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">Payout — {gig?.title}</p>
                      <p className="num text-xs text-text-tertiary">
                        {formatDate(t.createdAt)}{t.stripeRef ? ` · ${t.stripeRef}` : ""}
                      </p>
                    </div>
                    <span className="num text-sm font-bold text-money">+{formatMoney(t.amountCents)}</span>
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
