import Stripe from "stripe";
import { PLATFORM_FEE_PCT } from "./gig-machine";

/**
 * Stripe money movement for MCC.
 *
 * Model: a paying brand checks out for the gig amount. MCC keeps a
 * PLATFORM_FEE_PCT commission; the remainder goes to the creator.
 *  - If the creator has a connected (Stripe Express) account, we use a
 *    DESTINATION CHARGE so the split happens automatically and the creator is
 *    paid directly (MCC keeps `application_fee_amount`).
 *  - Otherwise the charge lands in MCC's balance and the creator's net is
 *    recorded as owed (pay out once they connect). This lets payments work
 *    before Stripe Connect is enabled / before a creator onboards.
 */
export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const PLATFORM_FEE_RATE = PLATFORM_FEE_PCT / 100;

export function commissionCents(amountCents: number): number {
  return Math.round(amountCents * PLATFORM_FEE_RATE);
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
 * Brand pays for a gig. If `creatorAccountId` is set we route a destination
 * charge so the creator gets paid directly and MCC keeps the commission.
 */
export async function createGigCheckout(
  stripe: Stripe,
  params: {
    gigId: string;
    title: string;
    amountCents: number;
    creatorAccountId?: string | null;
    creatorName?: string;
    successUrl: string;
    cancelUrl: string;
  },
) {
  const fee = commissionCents(params.amountCents);
  const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
    name: params.title || "MCC gig",
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
      metadata: {
        gigId: params.gigId,
        kind: "gig_payment",
        feeCents: String(fee),
      },
    },
  };

  if (params.creatorAccountId) {
    sessionParams.payment_intent_data = {
      application_fee_amount: fee,
      transfer_data: { destination: params.creatorAccountId },
      metadata: {
        gigId: params.gigId,
        kind: "gig_payment",
        feeCents: String(fee),
      },
    };
  } else {
    sessionParams.payment_intent_data!.metadata!.creatorNetCents = String(params.amountCents - fee);
  }

  return stripe.checkout.sessions.create(sessionParams);
}
