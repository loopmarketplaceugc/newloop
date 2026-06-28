import Stripe from "stripe";

/**
 * Stripe money movement for Loop — SEPARATE CHARGES & TRANSFERS (true escrow).
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
 * Brand funds a gig's escrow. The full amount is collected into Loop's platform
 * balance (no transfer_data) and held until the brand approves the work. The
 * gig id is stamped on the PaymentIntent so the webhook can reconcile funding
 * server-side even if the brand never returns to the success URL.
 */
export async function createGigCheckout(
  stripe: Stripe,
  params: {
    gigId: string;
    title: string;
    amountCents: number;
    creatorName?: string;
    successUrl: string;
    cancelUrl: string;
  },
) {
  const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
    name: params.title || "Loop gig",
  };
  if (params.creatorName) productData.description = `Content by ${params.creatorName}`;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
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
    metadata: { gigId: params.gigId, kind: "gig_payment" },
    payment_intent_data: {
      metadata: { gigId: params.gigId, kind: "gig_payment" },
    },
  };

  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Release a creator's net payout from escrow on brand approval. Idempotency key
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

/** Refund a brand from escrow on cancellation. Idempotency key keyed to the gig. */
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
