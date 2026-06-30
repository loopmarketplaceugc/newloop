import { NextResponse } from "next/server";
import { getStripeClient, applicationFeeCents } from "@/lib/connect-sample/stripe";

export const runtime = "nodejs";

/**
 * POST /api/connect-sample/checkout  { productId }
 *
 * Creates a hosted Stripe Checkout session for a single product using a
 * DESTINATION CHARGE: the platform takes an `application_fee_amount` and the
 * remainder is transferred to the seller's connected account
 * (`transfer_data.destination`). The customer pays on Stripe's hosted page.
 */
export async function POST(req: Request) {
  try {
    const stripeClient = getStripeClient();
    const { productId } = (await req.json().catch(() => ({}))) as { productId?: string };
    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    // Resolve price + seller from the product (the platform owns the catalog).
    const product = await stripeClient.products.retrieve(productId, {
      expand: ["default_price"],
    });
    const price = product.default_price;
    const priceObj = price && typeof price === "object" ? price : null;
    const unitAmount = priceObj?.unit_amount;
    const currency = priceObj?.currency ?? "usd";
    const connectedAccountId = product.metadata?.connected_account_id as string | undefined;

    if (!unitAmount || !connectedAccountId) {
      return NextResponse.json(
        { error: "Product is missing a price or a connected account mapping." },
        { status: 400 },
      );
    }

    const origin = new URL(req.url).origin;

    const session = await stripeClient.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: { name: product.name },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        // Platform's cut (10%). The rest is transferred to the seller.
        application_fee_amount: applicationFeeCents(unitAmount),
        transfer_data: { destination: connectedAccountId },
      },
      mode: "payment",
      success_url: `${origin}/connect-sample/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/connect-sample/storefront`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stripe error creating checkout session." },
      { status: 400 },
    );
  }
}
