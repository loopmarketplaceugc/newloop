import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient, createConnectAccount, createAccountLink } from "@/lib/stripe";
import { admin, authedUserId } from "@/lib/supabase-admin";
import { payoutOwedBalance } from "@/lib/ledger";
import { log } from "@/lib/log";

/**
 * Creator payout onboarding via Stripe Connect (Express).
 * The caller's identity and stored accountId are always resolved from auth + DB —
 * never from the request body — so an attacker cannot redirect payouts to their
 * own Stripe account or mint login links for someone else's account.
 */
const schema = z.object({
  action: z.enum(["start", "status", "login_link"]).default("start"),
  email: z.string().email().optional(),
  origin: z.string().url().optional(),
  // Still accepted so existing clients don't break, but ignored server-side.
  creatorId: z.string().optional(),
  accountId: z.string().optional(),
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
  const { action, email, origin } = parsed.data;
  const base = origin ?? new URL(req.url).origin;

  try {
    // Always look up the stored Stripe account from DB — never trust the client.
    const { data: profile } = await admin()
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", callerId)
      .maybeSingle();
    const storedAccountId = (profile?.stripe_account_id as string | null) ?? null;

    if (action === "status") {
      if (!storedAccountId) return NextResponse.json({ payoutsEnabled: false });
      const acct = await stripe.accounts.retrieve(storedAccountId);
      const payoutsEnabled = Boolean(acct.payouts_enabled);
      // Persist the flag, then flush any balance the creator accrued before connecting.
      if (payoutsEnabled) {
        await admin().from("profiles").update({ stripe_payouts_enabled: true }).eq("id", callerId);
        const paid = await payoutOwedBalance({ creatorId: callerId });
        if (!paid.ok) log.warn("stripe.connect", "owed-balance payout failed", { callerId, error: paid.error });
      }
      return NextResponse.json({
        payoutsEnabled,
        chargesEnabled: Boolean(acct.charges_enabled),
        accountId: storedAccountId,
      });
    }

    if (action === "login_link") {
      if (!storedAccountId) {
        return NextResponse.json({ error: "No Stripe account found. Complete payout setup first." }, { status: 400 });
      }
      const link = await stripe.accounts.createLoginLink(storedAccountId);
      return NextResponse.json({ url: link.url });
    }

    // action === "start": create or reuse the Express account.
    const account = storedAccountId
      ? await stripe.accounts.retrieve(storedAccountId)
      : await createConnectAccount(stripe, { email, creatorId: callerId });

    // Persist the account id server-side if it's new.
    if (!storedAccountId) {
      await admin()
        .from("profiles")
        .update({ stripe_account_id: account.id })
        .eq("id", callerId);
    }

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
