import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/connect-sample/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/connect-sample/webhook
 *
 * Listens for V2 "thin" account events so we can react when a connected
 * account's requirements or capabilities change (regulators, card networks, and
 * banks can change requirements at any time).
 *
 * Configure the event destination in the Stripe Dashboard → Developers →
 * Webhooks → Add destination:
 *   • Events from: Connected accounts
 *   • Advanced options → Payload style: Thin
 *   • Events: v2.core.account[requirements].updated
 *             v2.core.account[configuration.recipient].capability_status_updated
 *
 * Local testing with the Stripe CLI:
 *   stripe listen \
 *     --thin-events 'v2.core.account[requirements].updated,v2.core.account[configuration.recipient].capability_status_updated' \
 *     --forward-thin-to localhost:3000/api/connect-sample/webhook
 *
 * NOTE on SDK naming: older docs reference `parseThinEvent`. In the current SDK
 * the equivalent is `parseEventNotification`, which returns an EventNotification
 * (with `.type`, `.related_object`, `.fetchEvent()`, `.fetchRelatedObject()`).
 */
export async function POST(req: Request) {
  const stripeClient = getStripeClient();

  // PLACEHOLDER: the signing secret for THIS endpoint. The dashboard shows it
  // after you create the destination; the CLI prints a whsec_… on `stripe listen`.
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      {
        error:
          "STRIPE_CONNECT_WEBHOOK_SECRET is not set. Create a thin-event webhook " +
          "destination (or run `stripe listen`) and put its whsec_… signing secret " +
          "in your environment.",
      },
      { status: 500 },
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });

  // Thin events require the raw request body for signature verification.
  const rawBody = await req.text();

  let notification;
  try {
    // Verifies the signature and returns the thin EventNotification.
    notification = stripeClient.parseEventNotification(rawBody, sig, webhookSecret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 });
  }

  try {
    switch (notification.type) {
      // The account's onboarding requirements changed — re-fetch and collect any
      // newly-required info from the connected user.
      case "v2.core.account[requirements].updated": {
        const accountId = notification.related_object?.id;
        if (accountId) {
          const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
            include: ["configuration.recipient", "requirements"],
          });
          const status = account.requirements?.summary?.minimum_deadline?.status;
          console.log(`[connect-sample] requirements updated for ${accountId}: ${status}`);
          // TODO: if status is 'currently_due' / 'past_due', prompt the user to
          // finish onboarding (e.g. email them a fresh account link).
        }
        break;
      }

      // A capability flipped (e.g. the recipient can now receive transfers).
      case "v2.core.account[configuration.recipient].capability_status_updated": {
        const accountId = notification.related_object?.id;
        if (accountId) {
          const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
            include: ["configuration.recipient", "requirements"],
          });
          const transfersStatus =
            account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status;
          console.log(`[connect-sample] recipient capability for ${accountId}: ${transfersStatus}`);
          // TODO: when transfersStatus === 'active', mark the seller as payable.
        }
        break;
      }

      default: {
        // For anything else, you can pull the full event for inspection:
        // const event = await stripeClient.v2.core.events.retrieve(notification.id);
        console.log(`[connect-sample] unhandled thin event: ${notification.type}`);
        break;
      }
    }
  } catch (e) {
    // 500 so Stripe retries (handlers above are safe to re-run).
    const msg = e instanceof Error ? e.message : "handler error";
    console.error(`[connect-sample] webhook handler error for ${notification.type}:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
