"use client";

import { ArrowUpRight, CreditCard, Receipt, RotateCcw, ShieldCheck } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { ESCROW_HELD_STATUSES } from "@/lib/gig-machine";
import { formatDate, formatMoney } from "@/lib/format";
import { toast } from "@/components/ui/toast";

export default function BillingPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const { gigs, transactions } = useApp();

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

  const txLabel = { fund: "Escrow funding", release: "Released to creator", refund: "Refund", fee: "Platform fee" } as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Billing</h1>
          <p className="mt-0.5 text-sm text-text-secondary">Funding, escrow, and receipts — powered by Stripe.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast("Payment method", { body: "Visa ••42 is your default. Update cards in Stripe's billing portal.", tone: "info" })}
        >
          <CreditCard className="h-4 w-4" /> Visa ••42
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Held in escrow</p>
            <p className="num mt-1 text-3xl font-semibold">{formatMoney(inEscrow)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
              <ShieldCheck className="h-3.5 w-3.5 text-money" /> Refundable per stage until approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Lifetime funded</p>
            <p className="num mt-1 text-3xl font-semibold">{formatMoney(funded)}</p>
            <p className="mt-1 text-xs text-text-tertiary">{myGigs.length} gigs, fee included in price</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Refunded</p>
            <p className="num mt-1 text-3xl font-semibold">{formatMoney(refunded)}</p>
            <p className="mt-1 text-xs text-text-tertiary">Per-stage cancellation rules</p>
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
              body="Fund your first gig and every movement of money shows up here with its Stripe reference."
            />
          ) : (
            <div className="divide-y divide-border">
              {myTx.map((t) => {
                const gig = myGigs.find((g) => g.id === t.gigId);
                const icon =
                  t.type === "refund" ? <RotateCcw className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />;
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="rounded-full bg-surface-2 p-1.5 text-text-tertiary">{icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {txLabel[t.type]} — {gig?.title}
                      </p>
                      <p className="num text-xs text-text-tertiary">{formatDate(t.createdAt)} · {t.stripeRef}</p>
                    </div>
                    {t.type === "fund" ? (
                      <span className="num text-sm font-semibold">−{formatMoney(t.amountCents)}</span>
                    ) : t.type === "refund" ? (
                      <span className="num text-sm font-semibold text-money">+{formatMoney(t.amountCents)}</span>
                    ) : (
                      <Badge variant="outline">{formatMoney(t.amountCents)}</Badge>
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
