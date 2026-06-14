"use client";

import { useState } from "react";
import { ArrowUpRight, CreditCard, ExternalLink, Loader2, Receipt, RotateCcw, ShieldCheck } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { CountUpMoney } from "@/components/shared/count-up";
import { ESCROW_HELD_STATUSES, PLATFORM_FEE_PCT, platformFeeCents, creatorPayoutCents } from "@/lib/gig-machine";
import { formatDate, formatMoney } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { openBillingPortal } from "@/lib/payments";
import { haptics } from "@/lib/haptics";

export default function BillingPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const email = useSession((s) => s.email);
  const isDemo = useSession((s) => s.isDemo);
  const { gigs, transactions, creators } = useApp();
  const [openingPortal, setOpeningPortal] = useState(false);

  if (!hydrated || !userId) return <CardSkeleton />;

  const myGigs = gigs.filter((g) => g.companyId === userId);
  const myGigIds = new Set(myGigs.map((g) => g.id));
  const myTx = transactions
    .filter((t) => myGigIds.has(t.gigId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const inEscrow = myGigs
    .filter((g) => ESCROW_HELD_STATUSES.includes(g.status))
    .reduce((s, g) => s + g.priceCents, 0);
  const funded = myTx.filter((t) => t.type === "fund").reduce((s, t) => s + t.amountCents, 0);
  const refunded = myTx.filter((t) => t.type === "refund").reduce((s, t) => s + t.amountCents, 0);
  const totalFees = myTx.filter((t) => t.type === "fee").reduce((s, t) => s + t.amountCents, 0);

  const txLabel = {
    fund: "Creator payment",
    release: "Creator payout",
    refund: "Refund",
    fee: `MCC commission (${PLATFORM_FEE_PCT}%)`,
  } as const;

  const handleManageBilling = async () => {
    if (isDemo) {
      toast("Demo mode", { body: "Sign up for a real account to manage billing.", tone: "info" });
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
            Creator payments flow through MCC escrow. We take a {PLATFORM_FEE_PCT}% commission — the rest goes straight to the creator.
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

      {/* Fee breakdown card */}
      <Card className="border-ink bg-ink text-[#faf6ef]">
        <CardContent className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#faf6ef]/50">MCC takes</p>
            <p className="num mt-1 font-serif text-5xl font-extrabold text-[#a8d98a]">{PLATFORM_FEE_PCT}%</p>
            <p className="mt-1 text-sm font-medium text-[#faf6ef]/60">of every gig — covers escrow, contracts, AI tools</p>
          </div>
          <div className="flex flex-col gap-2 text-sm font-bold">
            {[
              { label: "Brand pays", val: "$1,000", color: "text-[#faf6ef]" },
              { label: `MCC fee (${PLATFORM_FEE_PCT}%)`, val: `-$${PLATFORM_FEE_PCT * 10}`, color: "text-[#f2a3df]" },
              { label: "Creator receives", val: `$${1000 - PLATFORM_FEE_PCT * 10}`, color: "text-[#a8d98a]" },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between gap-10">
                <span className="text-[#faf6ef]/60">{label}</span>
                <span className={`num ${color}`}>{val}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Secured in escrow</p>
            <CountUpMoney cents={inEscrow} className="mt-1 block num text-3xl font-semibold" />
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
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Platform fees paid</p>
            <CountUpMoney cents={totalFees || Math.round(funded * PLATFORM_FEE_PCT / 100)} className="mt-1 block num text-3xl font-semibold text-text-secondary" />
            <p className="mt-1 text-xs text-text-tertiary">{PLATFORM_FEE_PCT}% of all gig payments</p>
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
                const icon = t.type === "refund"
                  ? <RotateCcw className="h-4 w-4" />
                  : <ArrowUpRight className="h-4 w-4" />;
                const isFund = t.type === "fund";
                const isRefund = t.type === "refund";
                const isFee = t.type === "fee";
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`rounded-full p-1.5 ${isFund ? "bg-[#f2a3df]/30 text-ink" : isRefund ? "bg-money-soft text-money" : "bg-surface-2 text-text-tertiary"}`}>
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">
                        {txLabel[t.type]}{creator ? ` · ${creator.name}` : gig ? ` · ${gig.title}` : ""}
                      </p>
                      <p className="num text-xs text-text-tertiary">{formatDate(t.createdAt)}{t.stripeRef ? ` · ${t.stripeRef}` : ""}</p>
                    </div>
                    <span className={`num text-sm font-bold ${isRefund ? "text-money" : isFee ? "text-text-tertiary" : ""}`}>
                      {isRefund ? "+" : "−"}{formatMoney(t.amountCents)}
                    </span>
                    {isFund && gig && (
                      <div className="hidden sm:flex flex-col items-end text-[11px] text-text-tertiary">
                        <span>creator: {formatMoney(creatorPayoutCents(gig.priceCents))}</span>
                        <span>fee: {formatMoney(platformFeeCents(gig.priceCents))}</span>
                      </div>
                    )}
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
