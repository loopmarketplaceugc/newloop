"use client";

import { ArrowDownLeft, ArrowUpRight, FileWarning, Landmark, Receipt } from "lucide-react";
import { useApp, useHydrated } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton";
import { CountUpMoney } from "@/components/shared/count-up";
import { companyById } from "@/lib/seed";
import { creatorPayoutCents, ESCROW_HELD_STATUSES, USAGE_REMINDER_DAYS } from "@/lib/gig-machine";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { toast } from "@/components/ui/toast";

export default function WalletPage() {
  const hydrated = useHydrated();
  const userId = useSession((s) => s.userId);
  const { gigs, transactions } = useApp();

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
  const expiring = myGigs.filter(
    (g) => g.usageExpiresAt && daysUntil(g.usageExpiresAt) > 0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold leading-[0.95]">Wallet</h1>
          <p className="mt-2 text-sm font-bold text-text-secondary">
            Stripe Express payouts land 2 business days after release.
          </p>
        </div>
        <Button
          variant="moneyOutline"
          size="sm"
          onClick={() => toast("Payout requested", { body: "Your available balance is on its way to your bank ending ••42.", tone: "success" })}
        >
          <Landmark className="h-4 w-4" /> Withdraw to bank
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Available (released)</p>
            <CountUpMoney cents={released} className="mt-1 block text-4xl font-semibold text-money" />
            <p className="mt-1 text-xs text-text-tertiary">After the 10% platform fee — you keep 90%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Pending in escrow</p>
            <p className="num mt-1 text-4xl font-semibold">{formatMoney(pending)}</p>
            <p className="mt-1 text-xs text-text-tertiary">Releases automatically on approval</p>
          </CardContent>
        </Card>
      </div>

      {expiring.length > 0 && (
        <Card>
          <CardContent>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              Usage rights tracker
            </p>
            <div className="space-y-2">
              {expiring.map((g) => {
                const days = daysUntil(g.usageExpiresAt!);
                return (
                  <div key={g.id} className="flex items-center justify-between gap-3 rounded-[8px] border border-border px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{g.title}</p>
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
            <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
              Brands are reminded {USAGE_REMINDER_DAYS} days before expiry. Ads running past this date
              require a renewal — the #1 thing creators lose money on elsewhere.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">Transactions</p>
          {myTx.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              body="Releases and fees show here the moment a brand approves your work."
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
                      <p className="truncate text-[13px] font-medium">
                        {isRelease ? "Escrow release" : "Platform fee (10%)"} — {gig?.title}
                      </p>
                      <p className="num text-xs text-text-tertiary">
                        {formatDate(t.createdAt)} · {t.stripeRef}
                      </p>
                    </div>
                    <span className={`num text-sm font-semibold ${isRelease ? "text-money" : "text-text-tertiary"}`}>
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
