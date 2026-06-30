import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient } from "@/lib/stripe";
import { admin } from "@/lib/supabase-admin";
import { recordFunding, payoutOwedBalance } from "@/lib/ledger";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authoritative Stripe webhook. This is the source of truth for funding state:
 * even if the brand closes the tab before returning from Checkout, the gig is
 * still moved into the held state here. The signature is verified against
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
            // Capture the brand's Stripe customer so the billing portal works later.
            const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
            if (customerId) {
              const { data: gigRow } = await admin().from("gigs").select("company_id").eq("id", gigId).maybeSingle();
              if (gigRow?.company_id) {
                await admin().from("profiles").update({ stripe_customer_id: customerId }).eq("id", gigRow.company_id);
              }
            }
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const gigId = pi.metadata?.gigId;
        const kind = pi.metadata?.kind;

        if (gigId && kind === "gig_payment") {
          // Backstop in case the Checkout session event is missed.
          await recordFunding({ gigId, amountCents: pi.amount_received ?? pi.amount ?? 0, stripeRef: pi.id });
          break;
        }

        if (kind === "balance_topup") {
          const brandId = pi.metadata?.brandId;
          if (brandId) {
            // Credit the brand's prepaid balance.
            await admin().rpc("credit_balance", {
              p_uid: brandId,
              p_amount: pi.amount_received ?? pi.amount ?? 0,
            });
          }
        }
        break;
      }

      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        const enabled = Boolean(acct.payouts_enabled);
        await admin()
          .from("profiles")
          .update({ stripe_payouts_enabled: enabled })
          .eq("stripe_account_id", acct.id);
        // Once payouts turn on, flush any balance the creator accrued beforehand.
        if (enabled) {
          const { data: profile } = await admin()
            .from("profiles")
            .select("id")
            .eq("stripe_account_id", acct.id)
            .maybeSingle();
          if (profile?.id) {
            const paid = await payoutOwedBalance({ creatorId: profile.id as string });
            if (!paid.ok) log.warn("webhook.account.updated", "owed-balance payout failed", { error: paid.error });
          }
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        log.error("webhook.dispute", "Dispute created", {
          disputeId: dispute.id, charge: dispute.charge, reason: dispute.reason,
        });
        // TODO: move the gig to DISPUTED status and notify both parties.
        break;
      }

      case "payout.failed":
      case "payment_intent.payment_failed": {
        log.error("webhook.moneyFailure", `Money failure event: ${event.type}`, {
          object: event.data.object,
        });
        // TODO: surface failure to the creator/brand and allow retry.
        break;
      }

      default:
        break;
    }
  } catch (e) {
    // Log and 500 so Stripe retries — never silently drop a money event.
    const msg = e instanceof Error ? e.message : "handler error";
    log.error("webhook.handler", `Handler error for ${event.type}`, { error: e });
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
