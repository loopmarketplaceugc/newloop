import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { stripeClient } from "@/lib/stripe";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vqbykppxpplctrrrpomg.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!key) return null;
  return createClient(url, key);
}

/**
 * Stripe Customer Portal for brands.
 * Creates a Stripe Customer if the brand doesn't have one yet,
 * saves the customer id to profiles, then returns a portal session URL.
 */
const schema = z.object({
  brandId: z.string().min(1),
  email: z.string().email().optional(),
  existingCustomerId: z.string().optional(),
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

  const { brandId, email, existingCustomerId, origin } = parsed.data;
  const base = origin ?? new URL(req.url).origin;

  try {
    let customerId = existingCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { brandId },
      });
      customerId = customer.id;

      // Persist so future calls reuse the same customer
      const sb = supabaseAdmin();
      if (sb) {
        await sb.from("profiles").update({ stripe_customer_id: customerId }).eq("id", brandId);
      }
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
