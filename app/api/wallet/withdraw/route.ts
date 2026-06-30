import { NextResponse } from "next/server";
import { z } from "zod";
import { admin, authedUserId } from "@/lib/supabase-admin";
import { stripeClient, createBalancePayout } from "@/lib/stripe";

const METHOD_LABELS: Record<string, string> = {
  cashapp: "Cash App",
  venmo: "Venmo",
  zelle: "Zelle",
  card: "Card",
};

const schema = z.object({
  amountCents: z.number().int().positive("Enter an amount greater than $0"),
  method: z.enum(["cashapp", "venmo", "zelle", "card"]),
  destination: z.string().trim().max(120).optional().default(""),
});

function escapeHtml(v: string) {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Looks like a card PAN (13–19 digits, ignoring spaces/dashes). Never email these. */
function looksLikeCardNumber(v: string) {
  return /(?:\d[ -]?){13,19}/.test(v) && v.replace(/[^\d]/g, "").length >= 13;
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return { sent: false, reason: "email-not-configured" };
  const from = process.env.EMAIL_FROM ?? "Loop <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) return { sent: false, reason: (await res.text()).slice(0, 300) };
  return { sent: true, reason: null };
}

function teamEmailHtml(p: {
  creatorName: string;
  handle: string | null;
  creatorEmail: string | null;
  amount: string;
  methodLabel: string;
  destination: string;
  when: string;
}) {
  const rows: [string, string][] = [
    ["Creator", p.creatorName],
    ["Handle", p.handle ? `@${p.handle}` : "—"],
    ["Email", p.creatorEmail ?? "—"],
    ["Amount", p.amount],
    ["Method", p.methodLabel],
    ["Send to", p.destination],
    ["Requested", p.when],
  ];
  return `<!doctype html>
<html><body style="margin:0;background:#f6f4ef;color:#101805;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 16px;background:#f6f4ef;"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #ded8cb;border-radius:18px;overflow:hidden;">
      <tr><td style="padding:24px 28px 6px;font-family:Georgia,serif;font-size:24px;font-weight:900;">Loop<span style="font-size:10px;vertical-align:super;">&reg;</span></td></tr>
      <tr><td style="padding:2px 28px 0;font-family:Georgia,serif;font-size:32px;font-weight:900;line-height:1.05;">Withdrawal request</td></tr>
      <tr><td style="padding:14px 28px 0;font-size:14px;color:#4d5642;">The amount has already been deducted from the creator's Loop balance. Send the payout and you're done.</td></tr>
      <tr><td style="padding:18px 28px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ded8cb;border-radius:14px;overflow:hidden;">
          ${rows.map(([k, v]) => `<tr>
            <td style="padding:11px 14px;border-bottom:1px solid #eee8dc;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#737b68;width:38%;">${escapeHtml(k)}</td>
            <td style="padding:11px 14px;border-bottom:1px solid #eee8dc;font-size:14px;font-weight:700;color:#101805;">${escapeHtml(v)}</td>
          </tr>`).join("")}
        </table>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function receiptEmailHtml(p: { creatorName: string; amount: string; methodLabel: string; destination: string; automated: boolean }) {
  const where = p.automated ? "your connected payout account" : escapeHtml(p.destination);
  return `<!doctype html>
<html><body style="margin:0;background:#f6f4ef;color:#101805;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 16px;background:#f6f4ef;"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #ded8cb;border-radius:18px;overflow:hidden;">
      <tr><td style="padding:24px 28px 6px;font-family:Georgia,serif;font-size:24px;font-weight:900;">Loop<span style="font-size:10px;vertical-align:super;">&reg;</span></td></tr>
      <tr><td style="padding:2px 28px 0;font-family:Georgia,serif;font-size:34px;font-weight:900;line-height:1.05;">Withdrawal confirmed.</td></tr>
      <tr><td style="padding:14px 28px 0;font-size:15px;line-height:1.55;color:#4d5642;">
        Hey ${escapeHtml(p.creatorName)} — we deducted <strong>${escapeHtml(p.amount)}</strong> from your Loop balance and are sending it via <strong>${escapeHtml(p.methodLabel)}</strong> to <strong>${where}</strong>.
      </td></tr>
      <tr><td style="padding:16px 28px 0;font-size:15px;line-height:1.55;color:#4d5642;">
        Expect it to arrive in <strong>1&ndash;2 business days</strong>.
      </td></tr>
      <tr><td style="padding:18px 28px 26px;font-size:13px;color:#737b68;">This is your receipt — no action needed. If you didn&rsquo;t request this, reply right away.</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export async function POST(req: Request) {
  const callerId = await authedUserId(req);
  if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { amountCents, method } = parsed.data;
  const destination = parsed.data.destination.trim();
  const isCard = method === "card";

  if (!isCard && !destination) {
    return NextResponse.json({ error: "Tell us where to send it." }, { status: 400 });
  }
  if (destination && looksLikeCardNumber(destination)) {
    return NextResponse.json(
      { error: "For your security, don't enter a full card number — card payouts go to your connected payout account." },
      { status: 400 },
    );
  }

  const { data: profile } = await admin()
    .from("profiles")
    .select("name, handle, balance_cents, stripe_account_id, stripe_payouts_enabled")
    .eq("id", callerId)
    .single();

  const balance = (profile?.balance_cents as number | undefined) ?? 0;
  if (amountCents > balance) {
    return NextResponse.json({ error: `Insufficient balance — you have ${money(balance)} available.` }, { status: 400 });
  }

  const stripe = stripeClient();

  // For card, confirm there's somewhere to pay BEFORE we deduct (when Stripe is live).
  if (isCard && stripe) {
    const acct = profile?.stripe_account_id as string | undefined;
    const ready = Boolean(profile?.stripe_payouts_enabled);
    if (!acct || !ready) {
      return NextResponse.json(
        { error: "Connect your payout account (Stripe) before withdrawing to card." },
        { status: 400 },
      );
    }
  }

  // Atomic, guarded debit — only succeeds if the balance is still what we read.
  const { data: debited } = await admin()
    .from("profiles")
    .update({ balance_cents: balance - amountCents })
    .eq("id", callerId)
    .eq("balance_cents", balance)
    .select("balance_cents")
    .maybeSingle();
  if (!debited) {
    return NextResponse.json({ error: "Your balance just changed — refresh and try again." }, { status: 409 });
  }
  const newBalance = debited.balance_cents as number;

  const rollback = () => admin().rpc("credit_balance", { p_uid: callerId, p_amount: amountCents });

  const methodLabel = METHOD_LABELS[method];
  const amount = money(amountCents);
  const creatorName = (profile?.name as string | undefined) || "A creator";
  let creatorEmail: string | null = null;
  try {
    const { data: u } = await admin().auth.admin.getUserById(callerId);
    creatorEmail = u?.user?.email ?? null;
  } catch {
    // non-fatal
  }

  // ── Card: Stripe automation (pays the creator's connected account) ──
  if (isCard) {
    if (stripe) {
      try {
        await createBalancePayout(stripe, {
          amountCents,
          destination: profile!.stripe_account_id as string,
          creatorId: callerId,
          idempotencyKey: `withdraw_${callerId}_${amountCents}_${new Date().toISOString()}`,
        });
      } catch (e) {
        await rollback();
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Stripe payout failed — your balance was not charged." },
          { status: 502 },
        );
      }
    }
    // Stripe not configured → treated as simulated (dev); balance already deducted.
    if (creatorEmail) {
      await sendEmail(
        creatorEmail,
        `Your Loop withdrawal — ${amount}`,
        receiptEmailHtml({ creatorName, amount, methodLabel, destination, automated: true }),
      );
    }
    return NextResponse.json({ ok: true, balanceCents: newBalance, automated: true });
  }

  // ── Cash App / Venmo / Zelle: notify the team to pay it out manually ──
  const teamTo = process.env.PAYOUTS_NOTIFY_EMAIL || process.env.EMAIL_REPLY_TO || "payouts@loop.so";
  const team = await sendEmail(
    teamTo,
    `Withdrawal request: ${amount} via ${methodLabel} — ${creatorName}`,
    teamEmailHtml({
      creatorName,
      handle: (profile?.handle as string | undefined) ?? null,
      creatorEmail,
      amount,
      methodLabel,
      destination,
      when: new Date().toUTCString(),
    }),
  );

  // If we couldn't notify the team AND email is configured, undo the debit so the
  // request isn't silently lost. (When email isn't configured at all, we keep the
  // deduction — the request still shows in the creator's receipt/return value.)
  if (!team.sent && team.reason !== "email-not-configured") {
    await rollback();
    return NextResponse.json({ error: "Couldn't submit your request just now — try again shortly." }, { status: 502 });
  }

  if (creatorEmail) {
    await sendEmail(
      creatorEmail,
      `Your Loop withdrawal request — ${amount}`,
      receiptEmailHtml({ creatorName, amount, methodLabel, destination, automated: false }),
    );
  }

  return NextResponse.json({ ok: true, balanceCents: newBalance, automated: false });
}
