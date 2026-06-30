"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, CreditCard, ExternalLink, Loader2, Plus, Receipt, RotateCcw, ShieldCheck, Wallet } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { CountUpMoney } from "@/components/shared/count-up";
import { HELD_STATUSES } from "@/lib/gig-machine";
import { formatDate, formatMoney } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { DEV_PAYMENTS, openBillingPortal } from "@/lib/payments";
import { authHeaders } from "@/lib/sync";
import { supabase } from "@/lib/supabase";
import { haptics } from "@/lib/haptics";

export default function BillingPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const email = useSession((s) => s.email);
  const isDemo = useSession((s) => s.isDemo);
  const { gigs, transactions, creators } = useApp();
  const [openingPortal, setOpeningPortal] = useState(false);
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [addingFunds, setAddingFunds] = useState(false);

  // Read the brand's pre-loaded balance (own profile row; refetch after top-up).
  const loadBalance = useCallback(async () => {
    if (!userId || isDemo) return;
    const { data } = await supabase().from("profiles").select("balance_cents").eq("id", userId).maybeSingle();
    if (data) setBalanceCents((data.balance_cents as number | undefined) ?? 0);
  }, [userId, isDemo]);

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  // Returning from a top-up Checkout: confirm + refresh the balance (the webhook
  // credits it; we poll a few times since it may land a moment after redirect).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("topup") === "1") {
      window.history.replaceState({}, "", "/dashboard/billing");
      toast("Funds added", { body: "Your Loop balance will update momentarily.", tone: "success" });
      let n = 0;
      const t = setInterval(() => { void loadBalance(); if (++n >= 4) clearInterval(t); }, 1500);
      return () => clearInterval(t);
    }
    if (sp.get("topup") === "0") {
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, [loadBalance]);

  const addFunds = async () => {
    const dollars = parseFloat(topupAmount);
    if (!dollars || dollars < 5) {
      toast("Enter an amount", { body: "Minimum top-up is $5.", tone: "warning" });
      return;
    }
    if (isDemo) {
      toast("Demo mode", { body: "Sign up for a real account to pre-load a balance.", tone: "info" });
      return;
    }
    setAddingFunds(true);
    haptics.step();
    try {
      const res = await fetch("/api/stripe/topup", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ amountCents: Math.round(dollars * 100), origin: window.location.origin }),
      });
      const d = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !d.url) throw new Error(d.error ?? "Could not start top-up.");
      window.location.assign(d.url);
    } catch (e) {
      haptics.error();
      setAddingFunds(false);
      toast("Couldn't add funds", { body: e instanceof Error ? e.message : "Try again shortly.", tone: "warning" });
    }
  };

  if (!hydrated || !userId) return <CardSkeleton />;

  const myGigs = gigs.filter((g) => g.companyId === userId);
  const myGigIds = new Set(myGigs.map((g) => g.id));
  const myTx = transactions
    .filter((t) => myGigIds.has(t.gigId) && (t.type === "fund" || t.type === "refund"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const onHold = myGigs
    .filter((g) => HELD_STATUSES.includes(g.status))
    .reduce((s, g) => s + g.priceCents, 0);
  const funded = myTx.filter((t) => t.type === "fund").reduce((s, t) => s + t.amountCents, 0);

  const txLabel: Record<string, string> = {
    fund: "Creator payment",
    refund: "Refund",
  };

  const handleManageBilling = async () => {
    if (isDemo) {
      toast("Demo mode", { body: "Sign up for a real account to manage billing.", tone: "info" });
      return;
    }
    if (DEV_PAYMENTS) {
      toast("Dev mode", { body: "Billing portal is disabled — payments are simulated.", tone: "info" });
      return;
    }
    setOpeningPortal(true);
    haptics.step();
    try {
      await openBillingPortal({ brandId: userId, email: email ?? undefined });
    } catch (e) {
      haptics.error();
      setOpeningPortal(false);
      toast("Couldn't open billing portal", {
        body: e instanceof Error ? e.message : "Try again shortly.",
        tone: "warning",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold leading-[0.95]">Billing</h1>
          <p className="mt-2 text-sm font-bold text-text-secondary">
            Pre-load a balance to fund gigs instantly — fully or partially — instead of entering a card each time. Creator payments stay held until you approve the work.
          </p>
        </div>
        <Button onClick={handleManageBilling} disabled={openingPortal} variant="outline" size="sm">
          {openingPortal
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <CreditCard className="h-4 w-4" />}
          {openingPortal ? "Opening…" : "Manage payment methods"}
          {!openingPortal && <ExternalLink className="h-3.5 w-3.5 opacity-50" />}
        </Button>
      </div>

      {/* Pre-loaded Loop balance — spent on gigs before any card charge. */}
      <Card className="border-ink bg-ink text-[#faf6ef]">
        <CardContent>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#faf6ef]/50">
                <Wallet className="h-3.5 w-3.5" /> Loop balance
              </p>
              <CountUpMoney cents={balanceCents ?? 0} className="mt-1 block num text-4xl font-extrabold text-[#a8d98a]" />
              <p className="mt-1 text-xs font-medium text-[#faf6ef]/50">Applied to gig funding automatically before any card charge.</p>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#faf6ef]/40">Add funds (USD)</label>
                <div className="flex items-center gap-1 rounded-[10px] bg-[#faf6ef]/10 px-2">
                  <span className="text-sm text-[#faf6ef]/50">$</span>
                  <Input
                    className="num w-24 border-0 bg-transparent text-[#faf6ef] focus-visible:ring-0"
                    inputMode="decimal"
                    placeholder="250"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  />
                </div>
              </div>
              <Button onClick={() => void addFunds()} disabled={addingFunds} className="bg-[#a8d98a] text-ink hover:bg-[#a8d98a]/90">
                {addingFunds ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {addingFunds ? "Opening…" : "Add funds"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">On hold</p>
            <CountUpMoney cents={onHold} className="mt-1 block num text-3xl font-semibold" />
            <p className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
              <ShieldCheck className="h-3.5 w-3.5 text-money" /> Released on creator approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Lifetime funded</p>
            <CountUpMoney cents={funded} className="mt-1 block num text-3xl font-semibold" />
            <p className="mt-1 text-xs text-text-tertiary">{myGigs.length} gig{myGigs.length !== 1 ? "s" : ""} total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Transaction history</p>
          {myTx.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              body="Pay your first creator and every movement of money shows up here with its Stripe reference."
            />
          ) : (
            <div className="divide-y divide-border">
              {myTx.map((t) => {
                const gig = myGigs.find((g) => g.id === t.gigId);
                const creator = creators.find((c) => c.id === gig?.creatorId);
                const isRefund = t.type === "refund";
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`rounded-full p-1.5 ${isRefund ? "bg-money-soft text-money" : "bg-[#f2a3df]/30 text-ink"}`}>
                      {isRefund ? <RotateCcw className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">
                        {txLabel[t.type] ?? t.type}{creator ? ` · ${creator.name}` : gig ? ` · ${gig.title}` : ""}
                      </p>
                      <p className="num text-xs text-text-tertiary">{formatDate(t.createdAt)}{t.stripeRef ? ` · ${t.stripeRef}` : ""}</p>
                    </div>
                    <span className={`num text-sm font-bold ${isRefund ? "text-money" : ""}`}>
                      {isRefund ? "+" : ""}{formatMoney(t.amountCents)}
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
