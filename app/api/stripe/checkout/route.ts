import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient, createGigCheckout, commissionCents } from "@/lib/stripe";

/**
 * Brand pays for a gig. Returns a Stripe Checkout URL. If the creator has a
 * connected account, the payment is split automatically (creator paid directly,
 * MCC keeps the commission). Otherwise the charge lands in MCC's balance.
 */
const schema = z.object({
  gigId: z.string().min(1),
  title: z.string().max(200).default("MCC gig"),
  amountCents: z.number().int().positive().max(5_000_000), // ≤ $50k sanity cap
  creatorAccountId: z.string().optional().nullable(),
  creatorName: z.string().max(120).optional(),
  origin: z.string().url().optional(),
});

export async function POST(req: Request) {
  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { gigId, title, amountCents, creatorAccountId, creatorName, origin } = parsed.data;
  const base = origin ?? new URL(req.url).origin;

  try {
    const session = await createGigCheckout(stripe, {
      gigId,
      title,
      amountCents,
      creatorAccountId: creatorAccountId ?? undefined,
      creatorName,
      successUrl: `${base}/gig/${gigId}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/gig/${gigId}?paid=0`,
    });
    return NextResponse.json({
      url: session.url,
      commissionCents: commissionCents(amountCents),
      split: Boolean(creatorAccountId),
    });
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
      typeof paymentIntent === "string"
        ? paymentIntent
        : paymentIntent?.id ?? null;
    const amountCents = session.amount_total ?? 0;

    return NextResponse.json({
      paid: session.payment_status === "paid",
      status: session.payment_status,
      gigId,
      paymentIntentId,
      amountCents,
      commissionCents: amountCents > 0 ? commissionCents(amountCents) : 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
