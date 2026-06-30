import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient, createGigCheckout } from "@/lib/stripe";
import { admin, authedUserId } from "@/lib/supabase-admin";

/**
 * Brand funds a gig's hold. The amount and parties are derived SERVER-SIDE
 * from the gig row — never trusted from the request body — so a brand can't
 * underpay, overpay, or redirect the payout. Only the gig's own company may
 * fund it, and only while it's awaiting payment.
 */
const schema = z.object({
  gigId: z.string().uuid(),
  origin: z.string().url().optional(),
});

export async function POST(req: Request) {
  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const callerId = await authedUserId(req);
  if (!callerId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { gigId, origin } = parsed.data;
  const base = origin ?? new URL(req.url).origin;

  const { data: gig } = await admin()
    .from("gigs")
    .select("id, company_id, creator_id, status, title, price_cents")
    .eq("id", gigId)
    .maybeSingle();

  if (!gig) return NextResponse.json({ error: "Gig not found" }, { status: 404 });
  if (gig.company_id !== callerId) {
    return NextResponse.json({ error: "Only the brand can pay for this gig" }, { status: 403 });
  }
  if (gig.status !== "OFFER_ACCEPTED") {
    return NextResponse.json({ error: "This gig is not awaiting payment" }, { status: 409 });
  }
  if (!gig.price_cents || gig.price_cents <= 0) {
    return NextResponse.json({ error: "Gig has no agreed price" }, { status: 409 });
  }

  const { data: creator } = await admin()
    .from("profiles")
    .select("name")
    .eq("id", gig.creator_id)
    .maybeSingle();

  try {
    const session = await createGigCheckout(stripe, {
      gigId: gig.id,
      title: gig.title,
      amountCents: gig.price_cents,
      creatorName: (creator?.name as string | undefined) ?? undefined,
      successUrl: `${base}/gig/${gig.id}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/gig/${gig.id}?paid=0`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** Verify a returned Checkout session before the client marks a gig paid. */
export async function GET(req: Request) {
  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const expectedGigId = url.searchParams.get("gigId");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing Checkout session id." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    const gigId = session.metadata?.gigId ?? null;
    if (expectedGigId && gigId && expectedGigId !== gigId) {
      return NextResponse.json({ error: "Checkout session does not match this gig." }, { status: 400 });
    }
    const paymentIntent = session.payment_intent;
    const paymentIntentId =
      typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id ?? null;

    return NextResponse.json({
      paid: session.payment_status === "paid",
      status: session.payment_status,
      gigId,
      paymentIntentId,
      amountCents: session.amount_total ?? 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
