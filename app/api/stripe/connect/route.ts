import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient, createConnectAccount, createAccountLink } from "@/lib/stripe";

/**
 * Creator payout onboarding via Stripe Connect (Express).
 * - action "start": create (or reuse) an Express account + return an onboarding link.
 * - action "status": report whether the account can receive payouts yet.
 * The client persists the returned accountId / payouts flag on its own profile row.
 */
const schema = z.object({
  action: z.enum(["start", "status", "login_link"]).default("start"),
  creatorId: z.string().min(1),
  email: z.string().email().optional(),
  accountId: z.string().optional(),
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
  const { action, creatorId, email, accountId, origin } = parsed.data;
  const base = origin ?? new URL(req.url).origin;

  try {
    if (action === "status") {
      if (!accountId) return NextResponse.json({ payoutsEnabled: false });
      const acct = await stripe.accounts.retrieve(accountId);
      return NextResponse.json({
        payoutsEnabled: Boolean(acct.payouts_enabled),
        chargesEnabled: Boolean(acct.charges_enabled),
        accountId,
      });
    }

    if (action === "login_link") {
      if (!accountId) return NextResponse.json({ error: "No account id" }, { status: 400 });
      const link = await stripe.accounts.createLoginLink(accountId);
      return NextResponse.json({ url: link.url });
    }

    const account =
      accountId
        ? await stripe.accounts.retrieve(accountId)
        : await createConnectAccount(stripe, { email, creatorId });

    const link = await createAccountLink(stripe, {
      accountId: account.id,
      returnUrl: `${base}/dashboard/wallet?payouts=done`,
      refreshUrl: `${base}/dashboard/wallet?payouts=refresh`,
    });

    return NextResponse.json({
      accountId: account.id,
      url: link.url,
      payoutsEnabled: Boolean((account as { payouts_enabled?: boolean }).payouts_enabled),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    // Most common: Connect not enabled on the platform account yet.
    const needsConnect = /sign(ed)? up for Connect|Connect/i.test(msg);
    return NextResponse.json(
      {
        error: needsConnect
          ? "Stripe Connect isn't enabled on the Loop account yet. Enable it at dashboard.stripe.com/connect, then try again."
          : msg,
        needsConnect,
      },
      { status: 400 },
    );
  }
}
