import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient, createConnectAccount } from "@/lib/stripe";

const schema = z.object({
  creatorId: z.string().min(1),
  email: z.string().email().optional(),
  accountId: z.string().optional(),
});

export async function POST(req: Request) {
  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Payments not configured." }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { creatorId, email, accountId } = parsed.data;

  try {
    const account = accountId
      ? await stripe.accounts.retrieve(accountId)
      : await createConnectAccount(stripe, { email, creatorId });

    const session = await stripe.accountSessions.create({
      account: account.id,
      components: {
        account_onboarding: { enabled: true },
      },
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      accountId: account.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
