"use client";

import { useState } from "react";
import { ArrowDownLeft, BadgeCheck, ExternalLink, FileWarning, Landmark, Loader2, Receipt, Send } from "lucide-react";
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
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { CountUpMoney } from "@/components/shared/count-up";
import { companyById } from "@/lib/seed";
import {
  creatorPayoutCents,
  HELD_STATUSES,
  USAGE_REMINDER_DAYS,
} from "@/lib/gig-machine";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { authHeaders } from "@/lib/sync";
import { toast } from "@/components/ui/toast";
import { DEV_PAYMENTS, refreshPayoutStatus, getExpressDashboardUrl } from "@/lib/payments";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type PayoutMethod = "cashapp" | "venmo" | "zelle" | "card";

const WITHDRAW_METHODS: { id: PayoutMethod; label: string; placeholder: string }[] = [
  { id: "cashapp", label: "Cash App", placeholder: "$cashtag" },
  { id: "venmo", label: "Venmo", placeholder: "@venmo-username" },
  { id: "zelle", label: "Zelle", placeholder: "Email or phone for Zelle" },
  { id: "card", label: "Card", placeholder: "Name on card + last 4 (we'll collect the rest securely)" },
];

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
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [wMethod, setWMethod] = useState<PayoutMethod>("cashapp");
  const [wDest, setWDest] = useState("");
  const [wAmount, setWAmount] = useState("");
  const [wSubmitting, setWSubmitting] = useState(false);

  if (!hydrated || !userId) return <CardSkeleton />;

  const myGigs = gigs.filter((g) => g.creatorId === userId);
  const myGigIds = new Set(myGigs.map((g) => g.id));
  const myTx = transactions
    .filter((t) => myGigIds.has(t.gigId) && t.type === "release")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const available = me?.balanceCents ?? 0;
  const pending = myGigs
    .filter((g) => HELD_STATUSES.includes(g.status))
    .reduce((s, g) => s + creatorPayoutCents(g.priceCents), 0);
  const expiring = myGigs.filter((g) => g.usageExpiresAt && daysUntil(g.usageExpiresAt) > 0);
  const payoutsReady = Boolean(me?.stripePayoutsEnabled);

  const fetchAccountSession = async () => {
    // Caller identity + Stripe account are resolved server-side from the auth token.
    const res = await fetch("/api/stripe/account-session", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ email: email || undefined }),
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
      const initial = await fetchAccountSession();
      if (initial.accountId && !me?.stripeAccountId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useApp.getState().updateCreator(userId, { stripeAccountId: initial.accountId } as any);
      }

      let firstSecret: string | null = initial.clientSecret!;

      const instance = loadConnectAndInitialize({
        publishableKey: pk,
        fetchClientSecret: async () => {
          if (firstSecret) {
            const s = firstSecret;
            firstSecret = null;
            return s;
          }
          // Session expired — fetch a fresh one.
          const d = await fetchAccountSession();
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

  const withdrawAmountCents = Math.round((parseFloat(wAmount) || 0) * 100);
  const wMethodLabel = WITHDRAW_METHODS.find((m) => m.id === wMethod)!.label;
  // Card withdrawals run through Stripe automation, so they need a connected payout account.
  const cardNeedsConnect = wMethod === "card" && !payoutsReady && !DEV_PAYMENTS;

  const openWithdraw = () => {
    if (available <= 0) {
      toast("Nothing to withdraw yet", { body: "Approved payouts land in your balance, ready to cash out.", tone: "info" });
      return;
    }
    setWAmount(String(available / 100));
    setWDest("");
    setWMethod("cashapp");
    setWithdrawOpen(true);
  };

  const submitWithdraw = async () => {
    if (withdrawAmountCents <= 0) {
      toast("Enter an amount", { body: "How much would you like to withdraw?", tone: "warning" });
      return;
    }
    if (withdrawAmountCents > available) {
      toast("Amount too high", { body: `You can withdraw up to ${formatMoney(available)}.`, tone: "warning" });
      return;
    }
    if (wMethod !== "card" && !wDest.trim()) {
      toast("Add a destination", { body: `Where should we send your ${wMethodLabel} payout?`, tone: "warning" });
      return;
    }
    if (cardNeedsConnect) {
      toast("Connect payouts first", { body: "Card withdrawals go through Stripe — connect your payout account below.", tone: "warning" });
      return;
    }
    if (isDemo) {
      setWithdrawOpen(false);
      haptics.success();
      toast("Demo mode", { body: "Sign up for a real account to request a payout.", tone: "info" });
      return;
    }
    setWSubmitting(true);
    haptics.step();
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ amountCents: withdrawAmountCents, method: wMethod, destination: wDest.trim() }),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string; balanceCents?: number; automated?: boolean };
      if (!res.ok || !d.ok) throw new Error(d.error ?? "Could not submit your request.");
      // Reflect the server-side deduction immediately.
      if (typeof d.balanceCents === "number") {
        useApp.getState().updateCreator(userId, { balanceCents: d.balanceCents });
      }
      haptics.success();
      setWithdrawOpen(false);
      setWAmount("");
      setWDest("");
      toast("Withdrawal requested", {
        body: d.automated
          ? `${formatMoney(withdrawAmountCents)} is on its way to your payout account via Stripe — arrives in 1–2 business days.`
          : `We got it — your ${wMethodLabel} payout arrives in 1–2 business days. A receipt is on its way to your email.`,
        tone: "success",
      });
    } catch (e) {
      haptics.error();
      toast("Couldn't submit withdrawal", { body: e instanceof Error ? e.message : "Try again shortly.", tone: "warning" });
    } finally {
      setWSubmitting(false);
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
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={openWithdraw}>
            <Send className="h-4 w-4" /> Withdraw
          </Button>
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
            <span className="sticker bg-[#a8d98a] text-[11px] text-ink">available</span>
            <CountUpMoney cents={available} className="mt-2 block font-serif text-4xl font-extrabold text-[#a8d98a]" />
            <p className="mt-1 text-xs font-bold text-[#faf6ef]/50">Ready to withdraw — tap Withdraw to cash out</p>
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

      {/* Withdraw dialog — manual payout request, reviewed + paid by the Loop team */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogTitle>Withdraw funds</DialogTitle>
          <DialogDescription>
            Cash App, Venmo, and Zelle are reviewed and paid by our team. Card pays out automatically
            via Stripe. Either way it arrives in 1–2 business days.
          </DialogDescription>
          <div className="mt-4 space-y-4">
            <div className="rounded-[10px] bg-surface-2 p-3 text-[12px] font-bold text-text-secondary">
              Available to withdraw: <span className="num text-money">{formatMoney(available)}</span>
            </div>
            <div>
              <Label>Amount (USD)</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">$</span>
                <Input
                  className="num pl-7"
                  inputMode="decimal"
                  value={wAmount}
                  onChange={(e) => setWAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                />
              </div>
            </div>
            <div>
              <Label>Payout method</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {WITHDRAW_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setWMethod(m.id)}
                    className={cn(
                      "rounded-[8px] border px-3 py-2 text-[13px] font-bold transition-colors cursor-pointer",
                      wMethod === m.id
                        ? "border-text-primary bg-text-primary text-bg"
                        : "border-border text-text-secondary hover:border-border-bright",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            {wMethod === "card" ? (
              <div className="rounded-[10px] border border-border bg-surface-2 p-3 text-[12px] font-bold text-text-secondary">
                {cardNeedsConnect ? (
                  <>Card payouts run through Stripe. Connect your payout account below first, then come back to withdraw.</>
                ) : (
                  <>Paid automatically to your connected payout account via Stripe — no details needed here.</>
                )}
              </div>
            ) : (
              <div>
                <Label>Send to</Label>
                <Input
                  className="mt-1.5"
                  placeholder={WITHDRAW_METHODS.find((m) => m.id === wMethod)!.placeholder}
                  value={wDest}
                  onChange={(e) => setWDest(e.target.value)}
                />
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => void submitWithdraw()}
              disabled={wSubmitting || cardNeedsConnect}
            >
              {wSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {wSubmitting ? "Submitting…" : `Withdraw ${formatMoney(withdrawAmountCents)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
