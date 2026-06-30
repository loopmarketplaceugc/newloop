import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/connect-sample/stripe";

export const runtime = "nodejs";

/**
 * POST /api/connect-sample/accounts
 * Create a V2 connected account where the PLATFORM is responsible for pricing
 * and fee collection.
 *
 * IMPORTANT: this uses the V2 Core Accounts API. We never pass a top-level
 * `type` (no 'express' / 'standard' / 'custom'). Instead the account is
 * configured as a `recipient` that can receive transfers into its Stripe
 * balance, with the platform set as the fees/losses collector.
 */
export async function POST(req: Request) {
  try {
    const stripeClient = getStripeClient();
    const body = (await req.json().catch(() => ({}))) as {
      displayName?: string;
      contactEmail?: string;
    };

    if (!body.displayName || !body.contactEmail) {
      return NextResponse.json(
        { error: "Both displayName and contactEmail are required." },
        { status: 400 },
      );
    }

    const account = await stripeClient.v2.core.accounts.create({
      // Shown to the connected user and in Stripe surfaces.
      display_name: body.displayName,
      contact_email: body.contactEmail,
      // Where the account operates. This sample assumes the US.
      identity: { country: "us" },
      // Give the connected user a Stripe Express dashboard.
      dashboard: "express",
      defaults: {
        responsibilities: {
          // The platform (your application) collects fees and absorbs losses.
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      configuration: {
        // Make this account a recipient that can receive transfers (destination
        // charges) into its Stripe balance.
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
    });

    // PRODUCTION NOTE: persist a mapping from YOUR user → account.id in your DB
    // here, e.g. `db.users.update(userId, { stripeAccountId: account.id })`.
    // This sample is intentionally DB-free: the browser stores the id in
    // localStorage, and the storefront lists accounts straight from Stripe.
    return NextResponse.json({ account });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stripe error creating account." },
      { status: 400 },
    );
  }
}

/**
 * GET /api/connect-sample/accounts            → list all connected accounts
 * GET /api/connect-sample/accounts?id=acct_…  → fetch ONE account's live status
 *
 * Per the sample's design, onboarding status is ALWAYS read live from the API
 * (never cached in a database).
 */
export async function GET(req: Request) {
  try {
    const stripeClient = getStripeClient();
    const id = new URL(req.url).searchParams.get("id");

    if (id) {
      // Pull the recipient configuration + requirements so we can derive status.
      const account = await stripeClient.v2.core.accounts.retrieve(id, {
        include: ["configuration.recipient", "requirements"],
      });

      // Can this account actually receive money yet?
      const readyToReceivePayments =
        account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers
          ?.status === "active";

      // Are there still onboarding requirements due?
      const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
      const onboardingComplete =
        requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

      return NextResponse.json({
        account,
        readyToReceivePayments,
        onboardingComplete,
        requirementsStatus: requirementsStatus ?? null,
      });
    }

    // List every connected account (used by the seller list + storefront).
    const accounts = await stripeClient.v2.core.accounts.list({ limit: 100 });
    return NextResponse.json({
      accounts: accounts.data.map((a) => ({ id: a.id, display_name: a.display_name })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stripe error reading accounts." },
      { status: 400 },
    );
  }
}
