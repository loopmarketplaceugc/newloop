import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/connect-sample/stripe";

export const runtime = "nodejs";

/**
 * POST /api/connect-sample/products
 * Create a product (with a default price) at the PLATFORM level — NOT on the
 * connected account. Because charges are destination charges, the platform owns
 * the catalog and routes funds to the seller at checkout.
 *
 * We store the seller's connected-account id in the product's `metadata` so the
 * storefront/checkout knows where to send the money. (You could store this in a
 * DB instead; metadata keeps the sample DB-free.)
 */
export async function POST(req: Request) {
  try {
    const stripeClient = getStripeClient();
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
      priceInCents?: number;
      currency?: string;
      connectedAccountId?: string;
    };

    if (!body.name || !body.priceInCents || !body.connectedAccountId) {
      return NextResponse.json(
        { error: "name, priceInCents, and connectedAccountId are required." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(body.priceInCents) || body.priceInCents <= 0) {
      return NextResponse.json(
        { error: "priceInCents must be a positive whole number of cents." },
        { status: 400 },
      );
    }

    const product = await stripeClient.products.create({
      name: body.name,
      description: body.description || undefined,
      default_price_data: {
        unit_amount: body.priceInCents,
        currency: body.currency || "usd",
      },
      // The mapping that lets checkout route funds to the right seller.
      metadata: { connected_account_id: body.connectedAccountId },
    });

    return NextResponse.json({ product });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stripe error creating product." },
      { status: 400 },
    );
  }
}

/**
 * GET /api/connect-sample/products → list all active products for the storefront,
 * with their default price expanded so we can show the amount.
 */
export async function GET() {
  try {
    const stripeClient = getStripeClient();
    const products = await stripeClient.products.list({
      active: true,
      limit: 100,
      expand: ["data.default_price"],
    });

    // Flatten to just what the storefront needs.
    const items = products.data.map((p) => {
      const price = p.default_price;
      const priceObj = price && typeof price === "object" ? price : null;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        connectedAccountId: (p.metadata?.connected_account_id as string | undefined) ?? null,
        unitAmount: priceObj?.unit_amount ?? null,
        currency: priceObj?.currency ?? "usd",
      };
    });

    return NextResponse.json({ products: items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Stripe error listing products." },
      { status: 400 },
    );
  }
}
