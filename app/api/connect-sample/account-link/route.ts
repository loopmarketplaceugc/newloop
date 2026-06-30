import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/connect-sample/stripe";

export const runtime = "nodejs";

/**
 * POST /api/connect-sample/account-link  { accountId }
 *
 * Creates a V2 Account Link that sends the connected user through Stripe-hosted
 * onboarding for the `recipient` configuration. The user clicks "Onboard to
 * collect payments" on the dashboard, we mint this link, and redirect them to
 * `accountLink.url`. When they finish (or bail) Stripe sends them back to our
 * return_url / refresh_url.
 */
export async function POST(req: Request) {
  try {
    const stripeClient = getStripeClient();
    const { accountId } = (await req.json().catch(() => ({}))) as { accountId?: string };
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required." }, { status: 400 });
    }

    // Absolute URLs are required. Derive them from the incoming request origin
    // so this works in local dev and production without hardcoding a domain.
    const origin = new URL(req.url).origin;

    const accountLink = await stripeClient.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["recipient"],
          // Stripe sends the user here if the link expires / needs refreshing.
          refresh_url: `${origin}/connect-sample?refresh=1&accountId=${accountId}`,
          // …and here when onboarding is finished.
          return_url: `${origin}/connect-sample?accountId=${accountId}`,
        },
      },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stripe error creating account link." },
      { status: 400 },
    );
  }
}
