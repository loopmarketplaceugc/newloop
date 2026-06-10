import Stripe from "stripe";

/**
 * Stripe Connect (Express) — escrow model:
 *  fund:   PaymentIntent on the platform account (manual capture → capture on accept)
 *  hold:   platform balance holds funds while gig.status is an escrow-held state
 *  release: on APPROVED — Transfer of (price − 10% fee) to the creator's connected account
 *  refund: per-stage refund policy on CANCELLED
 * Without STRIPE_SECRET_KEY the demo store simulates the same ledger rows.
 */
export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const PLATFORM_FEE_RATE = 0.1;

export async function fundEscrow(stripe: Stripe, params: { gigId: string; amountCents: number; customerId: string }) {
  return stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: "usd",
    customer: params.customerId,
    capture_method: "automatic",
    metadata: { gigId: params.gigId, kind: "escrow_fund" },
  });
}

export async function releaseToCreator(
  stripe: Stripe,
  params: { gigId: string; amountCents: number; connectedAccountId: string },
) {
  const fee = Math.round(params.amountCents * PLATFORM_FEE_RATE);
  return stripe.transfers.create({
    amount: params.amountCents - fee,
    currency: "usd",
    destination: params.connectedAccountId,
    metadata: { gigId: params.gigId, kind: "escrow_release", feeCents: String(fee) },
  });
}

export async function refundCompany(stripe: Stripe, params: { paymentIntentId: string; amountCents?: number }) {
  return stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    ...(params.amountCents ? { amount: params.amountCents } : {}),
  });
}
