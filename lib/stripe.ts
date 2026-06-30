import Stripe from "stripe";

/**
 * Stripe money movement for Loop — SEPARATE CHARGES & TRANSFERS (funds held by Loop).
 *
 * 1. Funding: the brand checks out for the full gig amount, collected entirely
 *    into Loop's platform balance. The money is genuinely held — nothing
 *    reaches the creator yet.
 * 2. Release: on brand approval, the server transfers the creator's net
 *    (amount − commission) to their connected account. Loop retains the rest.
 *
 * This is what makes "funds release the moment a brand approves" literally true
 * — unlike a destination charge, which would pay the creator at funding time.
 * If the creator hasn't connected payouts yet, the transfer is deferred and the
 * amount owed is tracked on their profile balance.
 */
export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/** Create (or fetch) a Stripe Express account for a creator's payouts. */
export async function createConnectAccount(
  stripe: Stripe,
  params: { email?: string; creatorId: string },
) {
  return stripe.accounts.create({
    type: "express",
    email: params.email,
    capabilities: { transfers: { requested: true } },
    business_type: "individual",
    metadata: { creatorId: params.creatorId },
  });
}

/** Onboarding link the creator follows to finish payout setup. */
export async function createAccountLink(
  stripe: Stripe,
  params: { accountId: string; returnUrl: string; refreshUrl: string },
) {
  return stripe.accountLinks.create({
    account: params.accountId,
    type: "account_onboarding",
    return_url: params.returnUrl,
    refresh_url: params.refreshUrl,
  });
}

/**
 * Brand funds a gig's hold. The full amount is collected into Loop's platform
 * balance (no transfer_data) and held until the brand approves the work. The
 * gig id is stamped on the PaymentIntent so the webhook can reconcile funding
 * server-side even if the brand never returns to the success URL.
 */
export async function createGigCheckout(
  stripe: Stripe,
  params: {
    gigId: string;
    title: string;
    amountCents: number; // amount to CHARGE the card (gig price minus any applied balance)
    creatorName?: string;
    successUrl: string;
    cancelUrl: string;
    // How much of the gig price was covered by the brand's pre-loaded balance
    // (already debited at session creation). Stamped in metadata so the
    // completion handler records the full price and the expiry handler can
    // refund this balance if the brand abandons checkout. 0 when none applied.
    balanceAppliedCents?: number;
  },
) {
  const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
    name: params.title || "Loop gig",
  };
  if (params.creatorName) productData.description = `Content by ${params.creatorName}`;

  const balanceApplied = String(params.balanceAppliedCents ?? 0);
  const meta = { gigId: params.gigId, kind: "gig_payment", balanceApplied };

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    // Expire in 30 min (the minimum Stripe allows) so any pre-loaded balance
    // applied to this session is released promptly via checkout.session.expired
    // if the brand abandons checkout — rather than being tied up for 24h.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    // Always mint a Customer so the brand's billing portal works on return.
    customer_creation: "always",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: params.amountCents,
          product_data: productData,
        },
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: meta,
    payment_intent_data: { metadata: meta },
  };

  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Release a creator's net payout from the hold on brand approval. Idempotency key
 * is keyed to the gig so a retried/duplicated release can never transfer twice.
 */
export async function createPayoutTransfer(
  stripe: Stripe,
  params: { amountCents: number; destination: string; gigId: string },
) {
  return stripe.transfers.create(
    {
      amount: params.amountCents,
      currency: "usd",
      destination: params.destination,
      metadata: { gigId: params.gigId, kind: "gig_payout" },
    },
    { idempotencyKey: `release_${params.gigId}` },
  );
}

/**
 * Pay out a creator's accrued owed balance (earned before they connected
 * payouts). Not tied to a single gig. Idempotency key is keyed to the creator +
 * amount so a retried claim of the same amount can't transfer twice within
 * Stripe's idempotency window.
 */
export async function createBalancePayout(
  stripe: Stripe,
  params: { amountCents: number; destination: string; creatorId: string; idempotencyKey: string },
) {
  return stripe.transfers.create(
    {
      amount: params.amountCents,
      currency: "usd",
      destination: params.destination,
      metadata: { creatorId: params.creatorId, kind: "balance_payout" },
    },
    // Unique per payout event (not per amount) so two distinct same-amount
    // payouts can't collide and silently dedupe to a single transfer.
    { idempotencyKey: params.idempotencyKey },
  );
}

/** Refund a brand from the hold on cancellation. Idempotency key keyed to the gig. */
export async function createGigRefund(
  stripe: Stripe,
  params: { paymentIntentId: string; amountCents: number; gigId: string },
) {
  return stripe.refunds.create(
    {
      payment_intent: params.paymentIntentId,
      amount: params.amountCents,
      metadata: { gigId: params.gigId, kind: "gig_refund" },
    },
    { idempotencyKey: `refund_${params.gigId}` },
  );
}
