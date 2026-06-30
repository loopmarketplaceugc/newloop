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
 *
 * REQUIRED event subscriptions on this endpoint (Stripe Dashboard → Webhooks):
 *   - checkout.session.completed   (gig funding + balance top-ups)
 *   - checkout.session.expired     (REFUNDS pre-loaded balance applied to an
 *                                   abandoned gig checkout — must be enabled or
 *                                   abandoned partial-funding balance is stranded
 *                                   until the 30-min session expiry is processed)
 *   - payment_intent.succeeded     (funding/top-up backstop)
 *   - account.updated              (creator payout capability)
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

  // Idempotency note: gig funding/release are idempotent via unique(gig_id,type),
  // account.updated via claim_balance, and balance top-ups via credit_balance_once
  // (which atomically records the event id) — so each handler is individually safe
  // against Stripe's at-least-once redelivery without a fragile pre-claim here.
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break;

        // Billing balance top-up via hosted Checkout → credit the brand's balance.
        if (session.metadata?.kind === "balance_topup") {
          const brandId = session.metadata?.brandId;
          if (brandId) {
            const { error } = await admin().rpc("credit_balance_once", {
              p_uid: brandId,
              p_amount: session.amount_total ?? 0,
              p_event_key: event.id,
            });
            if (error && /credit_balance_once|does not exist|schema cache/i.test(error.message)) {
              await admin().rpc("credit_balance", { p_uid: brandId, p_amount: session.amount_total ?? 0 });
            } else if (error) {
              throw new Error(`credit_balance_once failed: ${error.message}`);
            }
            const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
            if (customerId) await admin().from("profiles").update({ stripe_customer_id: customerId }).eq("id", brandId);
          }
          break;
        }

        // Gig funding. Record the FULL price held = card charge (amount_total)
        // plus any pre-loaded balance applied at session creation.
        const gigId = session.metadata?.gigId;
        if (gigId) {
          const balanceApplied = parseInt(session.metadata?.balanceApplied ?? "0", 10) || 0;
          const pi = session.payment_intent;
          const ref = typeof pi === "string" ? pi : pi?.id ?? `sess_${session.id}`;
          await recordFunding({
            gigId,
            amountCents: (session.amount_total ?? 0) + balanceApplied,
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
        break;
      }

      // Brand abandoned a gig checkout that had pre-loaded balance applied →
      // refund that balance (idempotent via the event id).
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const balanceApplied = parseInt(session.metadata?.balanceApplied ?? "0", 10) || 0;
        const gigId = session.metadata?.gigId;
        if (gigId && balanceApplied > 0) {
          const { data: gigRow } = await admin().from("gigs").select("company_id").eq("id", gigId).maybeSingle();
          if (gigRow?.company_id) {
            const { error } = await admin().rpc("credit_balance_once", {
              p_uid: gigRow.company_id,
              p_amount: balanceApplied,
              p_event_key: event.id,
            });
            if (error && /credit_balance_once|does not exist|schema cache/i.test(error.message)) {
              await admin().rpc("credit_balance", { p_uid: gigRow.company_id, p_amount: balanceApplied });
            } else if (error) {
              throw new Error(`credit_balance_once failed: ${error.message}`);
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
          // Backstop in case the Checkout session event is missed. Record the
          // full price = card charge + any pre-loaded balance applied.
          const balanceApplied = parseInt(pi.metadata?.balanceApplied ?? "0", 10) || 0;
          await recordFunding({
            gigId,
            amountCents: (pi.amount_received ?? pi.amount ?? 0) + balanceApplied,
            stripeRef: pi.id,
          });
          break;
        }

        if (kind === "balance_topup") {
          const brandId = pi.metadata?.brandId;
          if (brandId) {
            // Credit the brand's prepaid balance exactly once per event — atomic
            // dedup so a redelivered topup can't double-credit.
            const { error } = await admin().rpc("credit_balance_once", {
              p_uid: brandId,
              p_amount: pi.amount_received ?? pi.amount ?? 0,
              p_event_key: event.id,
            });
            if (error) {
              if (/credit_balance_once|does not exist|schema cache/i.test(error.message)) {
                // RPC not migrated yet → fall back to the plain credit (degraded).
                await admin().rpc("credit_balance", {
                  p_uid: brandId,
                  p_amount: pi.amount_received ?? pi.amount ?? 0,
                });
              } else {
                // Transient failure → throw so Stripe retries (the RPC is idempotent).
                throw new Error(`credit_balance_once failed: ${error.message}`);
              }
            }
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
    // Log and 500 so Stripe retries — handlers are idempotent, so reprocessing
    // a redelivered event is safe.
    const msg = e instanceof Error ? e.message : "handler error";
    log.error("webhook.handler", `Handler error for ${event.type}`, { error: e });
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
