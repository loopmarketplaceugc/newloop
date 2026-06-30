import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient } from "@/lib/stripe";
import { admin, authedUserId } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * POST /api/stripe/topup  { amountCents, origin? }
 *
 * Brand pre-loads (tops up) their Loop balance via hosted Checkout. The charge
 * lands in Loop's platform balance; on completion the webhook credits the
 * brand's `balance_cents` (idempotent). That balance is then spent on gigs —
 * fully or partially — instead of charging a card per deal.
 */
const schema = z.object({
  amountCents: z.number().int().min(500, "Minimum top-up is $5").max(5_000_000, "Amount too large"),
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
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { amountCents } = parsed.data;
  const base = parsed.data.origin ?? new URL(req.url).origin;

  // Only brands hold a spendable top-up balance.
  const { data: profile } = await admin().from("profiles").select("role").eq("id", callerId).maybeSingle();
  if ((profile?.role as string | undefined) !== "company") {
    return NextResponse.json({ error: "Only brand accounts can pre-load a balance." }, { status: 403 });
  }

  try {
    const meta = { kind: "balance_topup", brandId: callerId };
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: { name: "Loop balance top-up" },
          },
        },
      ],
      success_url: `${base}/dashboard/billing?topup=1`,
      cancel_url: `${base}/dashboard/billing?topup=0`,
      metadata: meta,
      payment_intent_data: { metadata: meta },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stripe error creating top-up." },
      { status: 400 },
    );
  }
}
