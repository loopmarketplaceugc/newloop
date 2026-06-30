import { NextResponse } from "next/server";
import { z } from "zod";
import { admin, authedUserId } from "@/lib/supabase-admin";

const METHOD_LABELS: Record<string, string> = {
  cashapp: "Cash App",
  venmo: "Venmo",
  zelle: "Zelle",
  card: "Card",
};

const schema = z.object({
  amountCents: z.number().int().positive("Enter an amount greater than $0"),
  method: z.enum(["cashapp", "venmo", "zelle", "card"]),
  destination: z.string().trim().min(1, "Tell us where to send it").max(120),
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

/** Looks like a card PAN (13–19 digits, ignoring spaces/dashes). */
function looksLikeCardNumber(v: string) {
  return /(?:\d[ -]?){13,19}/.test(v) && (v.replace(/[^\d]/g, "").length >= 13);
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
      <tr><td style="padding:14px 28px 0;font-size:14px;color:#4d5642;">A creator requested a payout. Cross-check and process it, then mark it paid.</td></tr>
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

function receiptEmailHtml(p: { creatorName: string; amount: string; methodLabel: string; destination: string }) {
  return `<!doctype html>
<html><body style="margin:0;background:#f6f4ef;color:#101805;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 16px;background:#f6f4ef;"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #ded8cb;border-radius:18px;overflow:hidden;">
      <tr><td style="padding:24px 28px 6px;font-family:Georgia,serif;font-size:24px;font-weight:900;">Loop<span style="font-size:10px;vertical-align:super;">&reg;</span></td></tr>
      <tr><td style="padding:2px 28px 0;font-family:Georgia,serif;font-size:34px;font-weight:900;line-height:1.05;">Withdrawal requested.</td></tr>
      <tr><td style="padding:14px 28px 0;font-size:15px;line-height:1.55;color:#4d5642;">
        Hey ${escapeHtml(p.creatorName)} — we got your request to withdraw <strong>${escapeHtml(p.amount)}</strong> via <strong>${escapeHtml(p.methodLabel)}</strong> to <strong>${escapeHtml(p.destination)}</strong>.
      </td></tr>
      <tr><td style="padding:16px 28px 0;font-size:15px;line-height:1.55;color:#4d5642;">
        Our team will review and send it out. Payouts typically arrive in <strong>1&ndash;2 business days</strong>. We&rsquo;ll be in touch if we need anything.
      </td></tr>
      <tr><td style="padding:18px 28px 26px;font-size:13px;color:#737b68;">This is your receipt — no action needed. If you didn&rsquo;t request this, reply to this email right away.</td></tr>
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
  const { amountCents, method, destination } = parsed.data;

  // Never accept (or email) a full card number — collect card details securely out of band.
  if (looksLikeCardNumber(destination)) {
    return NextResponse.json(
      { error: "For your security, don't enter a full card number — we'll collect card details securely after you request." },
      { status: 400 },
    );
  }

  const { data: profile } = await admin().from("profiles").select("name, handle").eq("id", callerId).single();
  let creatorEmail: string | null = null;
  try {
    const { data: u } = await admin().auth.admin.getUserById(callerId);
    creatorEmail = u?.user?.email ?? null;
  } catch {
    // non-fatal — team email still goes out
  }

  const methodLabel = METHOD_LABELS[method];
  const amount = money(amountCents);
  const creatorName = (profile?.name as string | undefined) || "A creator";

  // Notify the Loop team so they can verify + pay it out.
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

  // Receipt to the creator.
  if (creatorEmail) {
    await sendEmail(
      creatorEmail,
      `Your Loop withdrawal request — ${amount}`,
      receiptEmailHtml({ creatorName, amount, methodLabel, destination }),
    );
  }

  return NextResponse.json({ ok: true, notified: team.sent });
}
