import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient } from "@/lib/stripe";
import { admin } from "@/lib/supabase-admin";
import { recordFunding } from "@/lib/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authoritative Stripe webhook. This is the source of truth for funding state:
 * even if the brand closes the tab before returning from Checkout, the gig is
 * still moved into escrow here. The signature is verified against
 * STRIPE_WEBHOOK_SECRET so the endpoint can't be spoofed. All handlers are
 * idempotent, so Stripe's at-least-once retries are safe.
 */
export async function POST(req: Request) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature failed: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          const gigId = session.metadata?.gigId;
          if (gigId) {
            const pi = session.payment_intent;
            const ref = typeof pi === "string" ? pi : pi?.id ?? `sess_${session.id}`;
            await recordFunding({
              gigId,
              amountCents: session.amount_total ?? 0,
              stripeRef: ref,
            });
          }
        }
        break;
      }
      case "payment_intent.succeeded": {
        // Backstop in case the Checkout session event is missed.
        const pi = event.data.object as Stripe.PaymentIntent;
        const gigId = pi.metadata?.gigId;
        if (gigId && pi.metadata?.kind === "gig_payment") {
          await recordFunding({ gigId, amountCents: pi.amount_received ?? pi.amount ?? 0, stripeRef: pi.id });
        }
        break;
      }
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        await admin()
          .from("profiles")
          .update({ stripe_payouts_enabled: Boolean(acct.payouts_enabled) })
          .eq("stripe_account_id", acct.id);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    // Log and 500 so Stripe retries — never silently drop a money event.
    const msg = e instanceof Error ? e.message : "handler error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
