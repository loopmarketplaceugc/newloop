"use client";

import { supabase } from "@/lib/supabase";

/**
 * Start (or resume) Stripe payout onboarding for the signed-in creator.
 * Persists the Stripe account id on their profile, then redirects to Stripe.
 */
export async function startPayoutOnboarding(params: {
  creatorId: string;
  email?: string;
  existingAccountId?: string;
}) {
  const res = await fetch("/api/stripe/connect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "start",
      creatorId: params.creatorId,
      email: params.email,
      accountId: params.existingAccountId,
      origin: window.location.origin,
    }),
  });
  const body = (await res.json()) as { url?: string; accountId?: string; error?: string };
  if (!res.ok || !body.url) {
    throw new Error(body.error ?? "Could not start payout setup.");
  }
  // Save the account id so we reuse it next time (RLS: users update own profile).
  if (body.accountId) {
    await supabase().from("profiles").update({ stripe_account_id: body.accountId }).eq("id", params.creatorId);
  }
  window.location.href = body.url;
}

/** Refresh whether the creator can receive payouts; persists the flag. */
export async function refreshPayoutStatus(params: { creatorId: string; accountId: string }) {
  const res = await fetch("/api/stripe/connect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "status", creatorId: params.creatorId, accountId: params.accountId }),
  });
  const body = (await res.json()) as { payoutsEnabled?: boolean };
  const enabled = Boolean(body.payoutsEnabled);
  await supabase()
    .from("profiles")
    .update({ stripe_payouts_enabled: enabled })
    .eq("id", params.creatorId);
  return enabled;
}

/** Brand pays for a gig — redirects to Stripe Checkout. */
export async function payForGig(params: {
  gigId: string;
  title: string;
  amountCents: number;
  creatorAccountId?: string;
  creatorName?: string;
}) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...params, origin: window.location.origin }),
  });
  const body = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !body.url) {
    throw new Error(body.error ?? "Could not start checkout.");
  }
  window.location.href = body.url;
}

/** Open the Stripe Customer Portal for a brand to manage their payment methods + receipts. */
export async function openBillingPortal(params: {
  brandId: string;
  email?: string;
  existingCustomerId?: string;
}) {
  const res = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...params, origin: window.location.origin }),
  });
  const body = (await res.json()) as { url?: string; customerId?: string; error?: string; needsPortal?: boolean };
  if (!res.ok || !body.url) {
    throw new Error(body.error ?? "Could not open billing portal.");
  }
  window.location.href = body.url;
}

/** Get a login link to the creator's Stripe Express dashboard (manage bank + see balance). */
export async function getExpressDashboardUrl(accountId: string): Promise<string> {
  const res = await fetch("/api/stripe/connect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login_link", creatorId: "self", accountId }),
  });
  const body = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !body.url) throw new Error(body.error ?? "Could not open payout dashboard.");
  return body.url;
}

/** Verify a completed Checkout session with Stripe before updating local gig state. */
export async function confirmGigPayment(params: { gigId: string; sessionId: string }) {
  const qs = new URLSearchParams({ gigId: params.gigId, session_id: params.sessionId });
  const res = await fetch(`/api/stripe/checkout?${qs.toString()}`);
  const body = (await res.json()) as {
    paid?: boolean;
    paymentIntentId?: string | null;
    error?: string;
  };
  if (!res.ok || !body.paid) {
    throw new Error(body.error ?? "Payment was not completed.");
  }
  return { paymentIntentId: body.paymentIntentId ?? undefined };
}
