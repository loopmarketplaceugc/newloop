import { admin } from "@/lib/supabase-admin";
import { platformFeeCents } from "@/lib/gig-machine";
import { refundPolicy } from "@/lib/gig-machine";
import {
  stripeClient,
  createPayoutTransfer,
  createBalancePayout,
} from "@/lib/stripe";
import { log } from "@/lib/log";
import type { GigStatus } from "@/lib/types";

/**
 * Server-authoritative money ledger. Every movement of money is written here
 * with the service role (clients have no INSERT rights on `transactions`), and
 * every operation is idempotent so a retry / duplicate webhook / double-click
 * can never move money twice.
 *
 * Key safety invariant: a creator's payout is derived from the amount that was
 * ACTUALLY collected into the hold (the recorded `fund` transaction), never from
 * the gig's current `price_cents`, which is denormalised and (in theory)
 * mutable. Combined with the DB-level `unique(gig_id, type)` constraint and the
 * price-freeze trigger, this makes the payout amount tamper-proof.
 */

// Funding may only advance a gig that the brand has actually accepted an offer
// on. DRAFT / OFFER_SENT have no signed contract (and possibly price 0), so a
// stray funding event must never push them into escrow.
const PRE_FUNDING: GigStatus[] = ["OFFER_ACCEPTED"];
// Payment is released only after the creator has PUBLISHED the live post and the
// brand approves it. Approving the draft (DELIVERED -> APPROVED) and publishing
// (APPROVED -> PUBLISHED) move no money.
const APPROVABLE: GigStatus[] = ["PUBLISHED"];

interface GigRow {
  id: string;
  company_id: string;
  creator_id: string;
  status: GigStatus;
  price_cents: number;
  usage_days: number | null;
}

type Result =
  | { ok: true; alreadyDone?: boolean; payout?: number; refund?: number }
  | { ok: false; status: number; error: string };

const UNIQUE_VIOLATION = "23505";

async function loadGig(gigId: string): Promise<GigRow | null> {
  const { data } = await admin()
    .from("gigs")
    .select("id, company_id, creator_id, status, price_cents, usage_days")
    .eq("id", gigId)
    .maybeSingle();
  return (data as GigRow | null) ?? null;
}

async function fundedAmountCents(gigId: string): Promise<number | null> {
  const { data } = await admin()
    .from("transactions")
    .select("amount_cents")
    .eq("gig_id", gigId)
    .eq("type", "fund")
    .maybeSingle();
  return (data?.amount_cents as number | undefined) ?? null;
}

async function hasTx(gigId: string, type: string): Promise<boolean> {
  const { data } = await admin()
    .from("transactions")
    .select("id")
    .eq("gig_id", gigId)
    .eq("type", type)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Record that a gig's hold has been funded (called by the Stripe webhook and,
 * in dev mode, by the brand-initiated fund route). Idempotent on (gig_id, fund).
 * `amountCents` is advisory; the funded amount is recorded as the gig's frozen
 * price so the recorded "held" amount can never diverge between the
 * checkout.session.completed and payment_intent.succeeded handlers (or be less
 * than the price the creator is owed). The full price is always collected =
 * card charge + any pre-loaded balance applied, both in Loop's platform balance.
 */
export async function recordFunding(params: {
  gigId: string;
  amountCents: number;
  stripeRef?: string;
}): Promise<Result> {
  const { gigId, amountCents, stripeRef } = params;
  const sb = admin();

  const gig = await loadGig(gigId);
  if (!gig) return { ok: false, status: 404, error: "Gig not found" };

  // Record the authoritative frozen price (falls back to the passed amount only
  // if the gig somehow has no price).
  const fundedCents = gig.price_cents && gig.price_cents > 0 ? gig.price_cents : amountCents;

  const { error: insErr } = await sb.from("transactions").insert({
    gig_id: gigId,
    type: "fund",
    amount_cents: fundedCents,
    stripe_ref: stripeRef ?? `fund_${gigId}`,
  });
  if (insErr) {
    if (insErr.code === UNIQUE_VIOLATION) return { ok: true, alreadyDone: true };
    return { ok: false, status: 400, error: insErr.message };
  }

  // Advance state only from a pre-funding status; never rewind a later gig.
  if (PRE_FUNDING.includes(gig.status)) {
    const usageExpiresAt = new Date(
      Date.now() + (gig.usage_days ?? 90) * 86_400_000,
    ).toISOString();
    await sb
      .from("gigs")
      .update({ status: "FUNDED_IN_ESCROW", usage_expires_at: usageExpiresAt })
      .eq("id", gigId);
    // Brand counter-signs the contract by funding it (creator signed on accept).
    await sb
      .from("contracts")
      .update({ company_signed_at: new Date().toISOString() })
      .eq("gig_id", gigId)
      .is("company_signed_at", null);
  }

  return { ok: true };
}

/**
 * Pay out a creator's accrued owed balance — money released to them before they
 * had connected payouts. Called when payouts become enabled (Connect status
 * refresh and the account.updated webhook). The claim is atomic (claim_balance
 * locks + zeroes the row) so concurrent callers can't double-pay; a failed
 * transfer re-credits the balance so the creator never loses money.
 */
export async function payoutOwedBalance(params: {
  creatorId: string;
}): Promise<{ ok: boolean; paid: number; error?: string }> {
  const { creatorId } = params;
  const sb = admin();

  const { data: profile } = await sb
    .from("profiles")
    .select("stripe_account_id, stripe_payouts_enabled, balance_cents")
    .eq("id", creatorId)
    .maybeSingle();

  const acct = profile?.stripe_account_id as string | undefined;
  const enabled = Boolean(profile?.stripe_payouts_enabled);
  const balance = (profile?.balance_cents as number | undefined) ?? 0;
  if (!acct || !enabled || balance <= 0) return { ok: true, paid: 0 };

  const stripe = stripeClient();
  if (!stripe) return { ok: true, paid: 0 };

  // Atomically claim the owed amount (sets balance to 0, returns prior value).
  const { data: claimed, error: claimErr } = await sb.rpc("claim_balance", { p_uid: creatorId });
  if (claimErr) {
    log.error("ledger.payoutOwedBalance", "claim_balance failed", { creatorId, error: claimErr });
    return { ok: false, paid: 0, error: claimErr.message };
  }
  const amount = (claimed as number | null) ?? 0;
  if (amount <= 0) return { ok: true, paid: 0 };

  try {
    // Unique key per payout event so distinct same-amount payouts don't collide.
    const idempotencyKey = `balance_${creatorId}_${crypto.randomUUID()}`;
    const transfer = await createBalancePayout(stripe, { amountCents: amount, destination: acct, creatorId, idempotencyKey });
    log.info("ledger.payoutOwedBalance", "paid owed balance", { creatorId, amount, transferId: transfer.id });
    return { ok: true, paid: amount };
  } catch (e) {
    // Re-credit so the creator doesn't lose money; they can retry.
    await sb.rpc("credit_balance", { p_uid: creatorId, p_amount: amount });
    log.error("ledger.payoutOwedBalance", "transfer failed; re-credited balance", { creatorId, amount, error: e });
    return { ok: false, paid: 0, error: e instanceof Error ? e.message : "Transfer failed" };
  }
}

/**
 * Release held funds to the creator on brand approval. Verified caller must
 * be the gig's company. Idempotent on (gig_id, release).
 */
export async function releaseFunds(params: {
  gigId: string;
  callerId: string;
}): Promise<Result> {
  const { gigId, callerId } = params;
  const sb = admin();

  const gig = await loadGig(gigId);
  if (!gig) return { ok: false, status: 404, error: "Gig not found" };
  if (gig.company_id !== callerId) {
    return { ok: false, status: 403, error: "Only the brand can approve this gig" };
  }
  if (!APPROVABLE.includes(gig.status)) {
    return { ok: false, status: 409, error: "This gig is not awaiting approval" };
  }

  if (await hasTx(gigId, "release")) return { ok: true, alreadyDone: true };

  // Payout is based on the money actually collected — not the (mutable) price.
  const funded = (await fundedAmountCents(gigId)) ?? gig.price_cents;
  const fee = platformFeeCents(funded);
  const payout = funded - fee;

  // Claim the operation atomically first (unique constraint = the real guard).
  const { error: insErr } = await sb.from("transactions").insert([
    { gig_id: gigId, type: "fee", amount_cents: fee, stripe_ref: `fee_${gigId}` },
    { gig_id: gigId, type: "release", amount_cents: payout, stripe_ref: `rel_${gigId}` },
  ]);
  if (insErr) {
    if (insErr.code === UNIQUE_VIOLATION) return { ok: true, alreadyDone: true };
    return { ok: false, status: 400, error: insErr.message };
  }

  // Move the money for real if Stripe is live and the creator can receive it.
  // `transferred` tracks whether the payout already left to the creator's bank —
  // if so we must NOT also credit their withdrawable balance, or they'd be paid
  // twice (once to bank, again via a manual withdrawal of balance_cents).
  let transferred = false;
  const stripe = stripeClient();
  if (stripe) {
    const { data: creator } = await sb
      .from("profiles")
      .select("stripe_account_id, stripe_payouts_enabled")
      .eq("id", gig.creator_id)
      .maybeSingle();
    const acct = creator?.stripe_account_id as string | undefined;
    const ready = Boolean(creator?.stripe_payouts_enabled);
    if (acct && ready) {
      try {
        const transfer = await createPayoutTransfer(stripe, {
          amountCents: payout,
          destination: acct,
          gigId,
        });
        await sb
          .from("transactions")
          .update({ stripe_ref: transfer.id })
          .eq("gig_id", gigId)
          .eq("type", "release");
        transferred = true;
      } catch (e) {
        // Roll back the claim so the brand can retry once payouts are fixed.
        await sb.from("transactions").delete().eq("gig_id", gigId).in("type", ["fee", "release"]);
        const msg = e instanceof Error ? e.message : "Stripe transfer failed";
        log.error("ledger.releaseFunds", "payout transfer failed; rolled back ledger claim", {
          gigId, creatorId: gig.creator_id, payout, error: e,
        });
        return { ok: false, status: 502, error: msg };
      }
    }
    // If not connected, funds stay in the platform balance and the creator's
    // `balance_cents` records what they're owed until they withdraw it.
  }

  // Only accrue to the withdrawable balance when the money did NOT auto-transfer.
  if (!transferred) {
    await sb.rpc("credit_balance", { p_uid: gig.creator_id, p_amount: payout });
  }
  // Stamp completed_at so the expiry clock (min post lifetime) can start.
  await sb
    .from("gigs")
    .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
    .eq("id", gigId);
  await sb.from("deliverables").update({ watermarked: false }).eq("gig_id", gigId);

  return { ok: true, payout };
}

/**
 * Cancel a gig and refund the brand per the stage-based refund policy. Verified
 * caller must be a party to the gig. Idempotent on (gig_id, refund).
 */
export async function recordRefund(params: {
  gigId: string;
  callerId: string;
}): Promise<Result> {
  const { gigId, callerId } = params;
  const sb = admin();

  const gig = await loadGig(gigId);
  if (!gig) return { ok: false, status: 404, error: "Gig not found" };
  if (gig.company_id !== callerId && gig.creator_id !== callerId) {
    return { ok: false, status: 403, error: "Not a party to this gig" };
  }
  if (gig.status === "COMPLETED" || gig.status === "CANCELLED") {
    return { ok: false, status: 409, error: "Gig is already closed" };
  }
  // Disputes are resolved by Loop support, not via a self-serve cancel/refund —
  // otherwise a brand could dispute already-delivered work and claw back funds.
  if (gig.status === "DISPUTED") {
    return { ok: false, status: 409, error: "This gig is in dispute — Loop support will resolve it." };
  }

  const cancel = () => sb.from("gigs").update({ status: "CANCELLED" }).eq("id", gigId);
  const funded = await fundedAmountCents(gigId);

  // Nothing was ever charged → safe to cancel immediately.
  if (funded == null) {
    await cancel();
    return { ok: true };
  }

  // Already refunded once → ensure the gig is closed and return idempotently.
  if (await hasTx(gigId, "refund")) {
    await cancel();
    return { ok: true, alreadyDone: true };
  }

  const { companyRefundPct } = refundPolicy(gig.status);
  const refundCents = Math.round((funded * companyRefundPct) / 100);

  // No refund due (e.g. post-delivery) → just close the gig.
  if (refundCents <= 0) {
    await cancel();
    return { ok: true, refund: 0 };
  }

  // Claim the refund atomically (unique constraint guards against double refund).
  const { error: insErr } = await sb.from("transactions").insert({
    gig_id: gigId,
    type: "refund",
    amount_cents: refundCents,
    stripe_ref: `re_${gigId}`,
  });
  if (insErr) {
    if (insErr.code === UNIQUE_VIOLATION) {
      await cancel();
      return { ok: true, alreadyDone: true };
    }
    return { ok: false, status: 400, error: insErr.message };
  }

  // Refunds are issued as Loop balance credit to the brand. The funds are
  // already in Loop's platform balance whether the gig was paid by card or from
  // pre-loaded balance, so crediting balance_cents is always covered and avoids
  // a card/balance split. Brands can't cash out balance (withdrawals are
  // creator-only), so this is safe store credit they re-spend on gigs.
  //
  // Credit via credit_balance_once keyed to `refund_<gigId>` so the credit is
  // crash-safe and exactly-once even if the claim row is deleted and retried
  // after a false-negative (the marker, not the deletable claim row, is the guard).
  const { error: creditErr } = await sb.rpc("credit_balance_once", {
    p_uid: gig.company_id,
    p_amount: refundCents,
    p_event_key: `refund_${gigId}`,
  });
  if (creditErr) {
    if (/credit_balance_once|does not exist|schema cache/i.test(creditErr.message)) {
      // Degraded (RPC not migrated): fall back to a plain credit.
      const { error: fbErr } = await sb.rpc("credit_balance", { p_uid: gig.company_id, p_amount: refundCents });
      if (fbErr) {
        await sb.from("transactions").delete().eq("gig_id", gigId).eq("type", "refund");
        log.error("ledger.recordRefund", "balance credit failed; rolled back refund claim", { gigId, refundCents, error: fbErr });
        return { ok: false, status: 502, error: fbErr.message };
      }
    } else {
      await sb.from("transactions").delete().eq("gig_id", gigId).eq("type", "refund");
      log.error("ledger.recordRefund", "balance credit failed; rolled back refund claim", { gigId, refundCents, error: creditErr });
      return { ok: false, status: 502, error: creditErr.message };
    }
  }

  // Only mark CANCELLED after the refund credit settles.
  await cancel();
  return { ok: true, refund: refundCents };
}
