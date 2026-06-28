import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient } from "@/lib/stripe";
import { admin, authedUserId } from "@/lib/supabase-admin";

/**
 * Stripe Customer Portal for brands.
 * brandId is derived from the verified auth token — never trusted from the body.
 */
const schema = z.object({
  existingCustomerId: z.string().optional(),
  email: z.string().email().optional(),
  origin: z.string().url().optional(),
  // still accepted so existing callers don't break, but ignored server-side
  brandId: z.string().optional(),
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

  const { email, existingCustomerId, origin } = parsed.data;
  const base = origin ?? new URL(req.url).origin;

  try {
    let customerId = existingCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { brandId: callerId },
      });
      customerId = customer.id;
      await admin().from("profiles").update({ stripe_customer_id: customerId }).eq("id", callerId);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url, customerId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    const needsPortal = /portal configuration|No default configuration/i.test(msg);
    return NextResponse.json(
      {
        error: needsPortal
          ? "Enable the Customer Portal at dashboard.stripe.com/settings/billing/portal, then try again."
          : msg,
        needsPortal,
      },
      { status: 400 },
    );
  }
}
