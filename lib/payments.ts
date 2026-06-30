"use client";

import { supabase } from "@/lib/supabase";

/**
 * When true, all payment buttons auto-succeed with no real Stripe charge.
 * Flip NEXT_PUBLIC_DEV_PAYMENTS=false (or remove it) to restore production Stripe.
 */
export const DEV_PAYMENTS =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEV_PAYMENTS === "true";

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
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch("/api/stripe/connect", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      action: "start",
      email: params.email,
      origin: window.location.origin,
    }),
  });
  const body = (await res.json()) as { url?: string; accountId?: string; error?: string };
  if (!res.ok || !body.url) {
    throw new Error(body.error ?? "Could not start payout setup.");
  }
  window.location.href = body.url;
}

/** Refresh whether the creator can receive payouts; persists the flag. */
export async function refreshPayoutStatus(params: { creatorId: string; accountId?: string }) {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch("/api/stripe/connect", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: "status" }),
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
 * Brand funds a gig. Pre-loaded balance is spent first server-side: if it fully
 * covers the price this returns `{ funded: true }` with NO redirect (caller
 * refreshes the gig). Otherwise the browser is redirected to Stripe Checkout for
 * the remaining card charge. Amount + parties are resolved server-side.
 */
export async function payForGig(params: { gigId: string }): Promise<{ funded: boolean }> {
  if (DEV_PAYMENTS) {
    await sleep(700);
    // Mirror the real Stripe return URL so the gig page's useEffect picks it up normally.
    const url = new URL(window.location.href);
    url.searchParams.set("paid", "1");
    url.searchParams.set("session_id", `dev_session_${Date.now()}`);
    window.location.href = url.toString();
    return { funded: false };
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
  const body = (await res.json()) as { url?: string; funded?: boolean; error?: string };
  if (!res.ok) throw new Error(body.error ?? "Could not start checkout.");
  // Fully covered by pre-loaded balance — no card charge / redirect.
  if (body.funded) return { funded: true };
  if (!body.url) throw new Error(body.error ?? "Could not start checkout.");
  window.location.href = body.url;
  return { funded: false };
}

/** Open the Stripe Customer Portal for a brand to manage their payment methods + receipts. */
export async function openBillingPortal(params: {
  brandId?: string;
  email?: string;
  existingCustomerId?: string;
}) {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch("/api/stripe/portal", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ email: params.email, existingCustomerId: params.existingCustomerId, origin: window.location.origin }),
  });
  const body = (await res.json()) as { url?: string; customerId?: string; error?: string; needsPortal?: boolean };
  if (!res.ok || !body.url) {
    throw new Error(body.error ?? "Could not open billing portal.");
  }
  window.location.href = body.url;
}

/** Get a login link to the creator's Stripe Express dashboard (manage bank + see balance). */
export async function getExpressDashboardUrl(): Promise<string> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch("/api/stripe/connect", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: "login_link" }),
  });
  const body = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !body.url) throw new Error(body.error ?? "Could not open payout dashboard.");
  return body.url;
}
