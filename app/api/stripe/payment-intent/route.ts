import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient } from "@/lib/stripe";
import { authedUserId } from "@/lib/supabase-admin";

const FIXED_AMOUNTS: Record<string, number> = {
  "$50": 5000,
  "$250": 25000,
};

// Custom amounts must be at least $250 — enforced here regardless of what the
// client sends. Never derived from a URL parameter; always from the request body
// of an authenticated POST.
const CUSTOM_MIN_CENTS = 25000;

const schema = z.discriminatedUnion("balance", [
  z.object({
    balance: z.enum(["$50", "$250"]),
    email: z.string().email().optional(),
  }),
  z.object({
    balance: z.literal("custom"),
    amountCents: z
      .number()
      .int("Amount must be a whole number of cents")
      .min(CUSTOM_MIN_CENTS, `Minimum custom top-up is $${CUSTOM_MIN_CENTS / 100}`),
    email: z.string().email().optional(),
  }),
]);

export async function POST(req: Request) {
  const callerId = await authedUserId(req);
  if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { balance, email } = parsed.data;
  const amountCents =
    balance === "custom" ? parsed.data.amountCents : FIXED_AMOUNTS[balance];

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { brandId: callerId, balance, kind: "balance_topup" },
      receipt_email: email,
      description: `Loop balance top-up ($${(amountCents / 100).toFixed(2)})`,
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
