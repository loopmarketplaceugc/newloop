"use client";

import { supabase } from "@/lib/supabase";

/**
 * When true, all payment buttons auto-succeed with no real Stripe charge.
 * Flip NEXT_PUBLIC_DEV_PAYMENTS=false (or remove it) to restore production Stripe.
 */
export const DEV_PAYMENTS = process.env.NEXT_PUBLIC_DEV_PAYMENTS === "true";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

/**
 * Brand funds a gig — redirects to Stripe Checkout. The amount and parties are
 * resolved server-side from the gig row, so only the gig id (plus the caller's
 * auth token) is sent.
 */
export async function payForGig(params: { gigId: string }) {
  if (DEV_PAYMENTS) {
    await sleep(700);
    // Mirror the real Stripe return URL so the gig page's useEffect picks it up normally.
    const url = new URL(window.location.href);
    url.searchParams.set("paid", "1");
    url.searchParams.set("session_id", `dev_session_${Date.now()}`);
    window.location.href = url.toString();
    return;
  }
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ gigId: params.gigId, origin: window.location.origin }),
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
