import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  creatorId: z.string().min(1),
  creatorEmail: z.string().email().optional().or(z.literal("")),
  creatorName: z.string().max(160).optional().or(z.literal("")),
  mccTag: z.string().max(80).optional().or(z.literal("")),
  opportunity: z.object({
    id: z.string().min(1),
    brand: z.string().min(1).max(120),
    campaign: z.string().min(1).max(160),
    platform: z.string().min(1).max(160),
    deliverables: z.string().min(1).max(240),
    videoLength: z.string().min(1).max(120),
    basePayCents: z.number().int().nonnegative(),
    maxPayCents: z.number().int().nonnegative(),
    viewBonusText: z.string().min(1).max(240),
  }),
});

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://vqbykppxpplctrrrpomg.supabase.co";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPay(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US")}`;
}

function applicationEmailHtml(params: z.infer<typeof schema>) {
  const op = params.opportunity;
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f4ef;color:#101805;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f6f4ef;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #ded8cb;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 30px 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;">
                MCC<span style="font-size:11px;vertical-align:super;">&reg;</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 30px 0;font-family:Georgia,'Times New Roman',serif;font-size:40px;font-weight:900;line-height:1;">
                Application received.
              </td>
            </tr>
            <tr>
              <td style="padding:16px 30px 0;font-size:15px;line-height:1.55;color:#4d5642;">
                Your MCC application for <strong>${escapeHtml(op.brand)}</strong> - ${escapeHtml(op.campaign)} is marked as applied.
              </td>
            </tr>
            <tr>
              <td style="padding:22px 30px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ded8cb;border-radius:16px;overflow:hidden;">
                  ${[
                    ["Platform", op.platform],
                    ["Deliverables", op.deliverables],
                    ["Video length", op.videoLength],
                    ["Base pay", formatPay(op.basePayCents)],
                    ["Max pay", formatPay(op.maxPayCents)],
                    ["View bonus", op.viewBonusText],
                  ]
                    .map(
                      ([k, v]) => `<tr>
                        <td style="padding:12px 14px;border-bottom:1px solid #eee8dc;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#737b68;">${escapeHtml(k)}</td>
                        <td style="padding:12px 14px;border-bottom:1px solid #eee8dc;font-size:14px;font-weight:700;color:#101805;">${escapeHtml(v)}</td>
                      </tr>`,
                    )
                    .join("")}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 28px;font-size:13px;line-height:1.5;color:#737b68;">
                This is a sample MCC listing unless the brand confirms the offer in your Messages tab.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendConfirmationEmail(params: z.infer<typeof schema>) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = params.creatorEmail;
  if (!apiKey || !to) return { emailed: false, reason: "email-not-configured" as const };

  const from = process.env.EMAIL_FROM ?? "MCC <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO;
  const op = params.opportunity;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `MCC application confirmed: ${op.brand} - ${op.campaign}`,
      html: applicationEmailHtml(params),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    return { emailed: false, reason: (await res.text()).slice(0, 500) };
  }
  return { emailed: true, reason: null };
}

async function storeApplication(params: z.infer<typeof schema>) {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) return { stored: false, reason: "service-role-not-configured" as const };

  const admin = createClient(SUPABASE_URL, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const op = params.opportunity;
  const { error } = await admin.from("opportunity_applications").upsert(
    {
      creator_id: params.creatorId,
      creator_email: params.creatorEmail || null,
      creator_name: params.creatorName || null,
      mcc_tag: params.mccTag || null,
      opportunity_id: op.id,
      brand: op.brand,
      campaign: op.campaign,
      platform: op.platform,
      deliverables: op.deliverables,
      base_pay_cents: op.basePayCents,
      max_pay_cents: op.maxPayCents,
    },
    { onConflict: "creator_id,opportunity_id" },
  );

  if (error) return { stored: false, reason: error.message };
  return { stored: true, reason: null };
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  }

  const [stored, email] = await Promise.all([
    storeApplication(parsed.data),
    sendConfirmationEmail(parsed.data),
  ]);

  return NextResponse.json({
    ok: true,
    stored: stored.stored,
    storedReason: stored.reason,
    emailed: email.emailed,
    emailReason: email.reason,
  });
}
