import Stripe from "stripe";

/**
 * ── Stripe Client (used for ALL Stripe requests in this sample) ──────────────
 *
 * Every endpoint in the Connect sample calls `getStripeClient()` and uses the
 * returned client. We intentionally DO NOT pass an `apiVersion`: the installed
 * SDK pins the version it ships with, and the V2 Connect preview API
 * (`2026-06-24.dahlia`) is selected automatically — there is nothing to set.
 *
 * If the secret key is missing we throw a clear, actionable error rather than
 * letting Stripe fail with a vague message.
 */
let cachedClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  // PLACEHOLDER: set STRIPE_SECRET_KEY in your environment (.env.local locally,
  // or your host's env vars in production). Use sk_test_… while developing and
  // sk_live_… in production. Find it at https://dashboard.stripe.com/apikeys
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add your Stripe secret key (sk_test_… for " +
        "development, sk_live_… for production) to your environment, then restart. " +
        "Get it from https://dashboard.stripe.com/apikeys",
    );
  }

  // Reuse one client instance across requests in the same server process.
  if (!cachedClient) {
    // new Stripe('sk_***') — the canonical Stripe Client. No apiVersion needed.
    cachedClient = new Stripe(apiKey);
  }
  return cachedClient;
}

/** The platform's commission on each sale, in basis points (10% here). */
export const PLATFORM_FEE_BPS = 1000; // 1000 bps = 10%

/** Compute the application (platform) fee for a given gross amount in cents. */
export function applicationFeeCents(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10_000);
}
