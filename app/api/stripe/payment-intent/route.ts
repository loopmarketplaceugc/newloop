import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient } from "@/lib/stripe";

const AMOUNT_MAP: Record<string, number> = {
  "$50": 5000,
  "$100": 10000,
  "$250+": 25000,
};

const schema = z.object({
  balance: z.enum(["$50", "$100", "$250+"]),
  brandId: z.string().min(1),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { balance, brandId, email } = parsed.data;
  const amountCents = AMOUNT_MAP[balance];

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: { brandId, balance },
      receipt_email: email,
      description: `Loop balance top-up (${balance})`,
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
