import { NextResponse } from "next/server";
import { z } from "zod";
import { admin } from "@/lib/supabase-admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  origin: z.string().url().optional(),
});

function escapeHtml(v: string) {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function confirmEmailHtml(confirmUrl: string, email: string) {
  const safeUrl = escapeHtml(confirmUrl);
  const safeEmail = escapeHtml(email);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#101805;color:#faf6ef;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101805;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:3px solid #faf6ef;border-radius:28px;background:#a8d98a;color:#101805;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:900;line-height:1;">
                Loop<span style="font-size:12px;vertical-align:super;">&reg;</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0;font-family:Georgia,'Times New Roman',serif;font-size:52px;font-weight:900;line-height:.92;letter-spacing:-1.5px;">
                Confirm your email.
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0;font-size:16px;line-height:1.5;font-weight:700;">
                One tap to activate your Loop account for <span style="font-family:monospace;">${safeEmail}</span>.
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <a href="${safeUrl}" style="display:inline-block;background:#101805;color:#a8d98a;text-decoration:none;border-radius:999px;padding:16px 24px;font-size:18px;font-weight:900;font-family:Georgia,'Times New Roman',serif;">
                  Confirm &amp; get started →
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;font-size:13px;line-height:1.5;font-weight:700;color:rgba(16,24,5,.65);">
                Didn't sign up? You can ignore this email — nothing will happen.
              </td>
            </tr>
          </table>
          <p style="max-width:520px;margin:18px auto 0;color:rgba(250,246,239,.55);font-size:12px;line-height:1.5;">
            Button not working? Paste this into your browser:<br />
            <span style="word-break:break-all;color:#a8d98a;">${safeUrl}</span>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(req: Request) {
  const rl = rateLimit(`resend-confirm:${clientIp(req)}`, 5, 5 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, origin } = parsed.data;
  const redirectTo = origin ? `${origin}/auth/callback` : undefined;
  const sb = admin();

  const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
    type: "signup",
    email,
    password: crypto.randomUUID(), // placeholder — existing password unchanged
    options: { ...(redirectTo ? { redirectTo } : {}) },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error("[resend-confirm] generateLink error:", linkErr?.message);
    return NextResponse.json({ error: "Could not resend — try signing up again." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  const from = process.env.EMAIL_FROM ?? "Loop <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Confirm your Loop account",
      html: confirmEmailHtml(linkData.properties.action_link, email),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    console.error("[resend-confirm] Resend error:", await res.text());
    return NextResponse.json({ error: "Email failed to send." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
