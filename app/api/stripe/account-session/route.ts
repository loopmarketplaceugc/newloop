import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient, createConnectAccount } from "@/lib/stripe";
import { admin, authedUserId } from "@/lib/supabase-admin";

const schema = z.object({
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  const callerId = await authedUserId(req);
  if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Payments not configured." }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email } = parsed.data;

  try {
    // Resolve the Stripe account from DB — never trust body accountId.
    const { data: profile } = await admin()
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", callerId)
      .maybeSingle();

    const existingAccountId = profile?.stripe_account_id as string | undefined;

    const account = existingAccountId
      ? await stripe.accounts.retrieve(existingAccountId)
      : await createConnectAccount(stripe, { email, creatorId: callerId });

    // Persist account id if it's new.
    if (!existingAccountId) {
      await admin()
        .from("profiles")
        .update({ stripe_account_id: account.id })
        .eq("id", callerId);
    }

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
