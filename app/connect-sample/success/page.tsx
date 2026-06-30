import Link from "next/link";
import { getStripeClient } from "@/lib/connect-sample/stripe";

export const dynamic = "force-dynamic";

/**
 * Customers land here after Stripe-hosted checkout. We retrieve the session
 * (server-side, using the Stripe Client) to confirm the payment really
 * succeeded before showing a success message.
 */
export default async function ConnectSampleSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let line = "Thanks! Your payment is being processed.";
  let error: string | null = null;

  if (session_id) {
    try {
      const stripeClient = getStripeClient();
      const session = await stripeClient.checkout.sessions.retrieve(session_id);
      const paid = session.payment_status === "paid";
      const amount =
        session.amount_total != null
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: (session.currency ?? "usd").toUpperCase(),
            }).format(session.amount_total / 100)
          : "";
      line = paid ? `Payment of ${amount} received. Thank you!` : `Payment status: ${session.payment_status}.`;
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not verify the session.";
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f6f4ef", color: "#101805", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid #ded8cb", borderRadius: 16, padding: 32, maxWidth: 460, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>✓</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Payment complete</h1>
        <p style={{ color: "#5b6150", fontSize: 15, margin: "0 0 16px" }}>{line}</p>
        {error && <p style={{ color: "#b42318", fontSize: 13 }}>↳ {error}</p>}
        <Link href="/connect-sample/storefront" style={{ display: "inline-block", background: "#101805", color: "#a8d98a", textDecoration: "none", borderRadius: 999, padding: "10px 20px", fontWeight: 700 }}>
          Back to storefront
        </Link>
      </div>
    </div>
  );
}
