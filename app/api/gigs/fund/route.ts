import { NextResponse } from "next/server";
import { admin, authedUserId } from "@/lib/supabase-admin";
import { recordFunding } from "@/lib/ledger";
import { stripeClient } from "@/lib/stripe";

/**
 * Record that a gig's hold has been funded by the brand.
 *
 * - Production (Stripe configured): a paid Checkout `sessionId` is required and
 *   verified against Stripe before any hold is recorded — so funding can't be
 *   faked without a real charge. The webhook is the primary path; this is the
 *   client's confirm-on-return path. Both are idempotent on (gig_id, fund).
 * - Dev (no Stripe): payments are simulated, so funding is recorded at the gig's
 *   agreed price for the verified brand.
 */
export async function POST(req: Request) {
  const callerId = await authedUserId(req);
  if (!callerId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { gigId?: string; sessionId?: string }
    | null;
  if (!body?.gigId) return NextResponse.json({ error: "gigId required" }, { status: 400 });

  const { data: gig } = await admin()
    .from("gigs")
    .select("id, company_id, price_cents")
    .eq("id", body.gigId)
    .maybeSingle();
  if (!gig) return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  if (gig.company_id !== callerId) {
    return NextResponse.json({ error: "Only the brand can fund this gig" }, { status: 403 });
  }

  const stripe = stripeClient();

  // Production: never record a hold without a verified paid session.
  if (stripe) {
    if (!body.sessionId) {
      return NextResponse.json({ error: "Missing payment confirmation" }, { status: 400 });
    }
    try {
      const session = await stripe.checkout.sessions.retrieve(body.sessionId, {
        expand: ["payment_intent"],
      });
      if (session.metadata?.gigId !== gig.id) {
        return NextResponse.json({ error: "Payment does not match this gig" }, { status: 400 });
      }
      if (session.payment_status !== "paid") {
        return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
      }
      const pi = session.payment_intent;
      const stripeRef = typeof pi === "string" ? pi : pi?.id ?? `sess_${session.id}`;
      // Full price held = card charge (amount_total) + pre-loaded balance applied.
      const balanceApplied = parseInt(session.metadata?.balanceApplied ?? "0", 10) || 0;
      const result = await recordFunding({
        gigId: gig.id,
        amountCents: (session.amount_total ?? gig.price_cents) + balanceApplied,
        stripeRef,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
      return NextResponse.json({ ok: true, alreadyDone: result.alreadyDone ?? false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Stripe verification failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  // Dev mode: simulated payment.
  const result = await recordFunding({
    gigId: gig.id,
    amountCents: gig.price_cents,
    stripeRef: `dev_pi_${gig.id}`,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, alreadyDone: result.alreadyDone ?? false });
}
