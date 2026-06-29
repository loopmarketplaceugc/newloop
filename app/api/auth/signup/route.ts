import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { admin } from "@/lib/supabase-admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["creator", "company"]),
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

async function sendConfirmEmail(to: string, confirmUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const from = process.env.EMAIL_FROM ?? "Loop <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: "Confirm your Loop account",
      html: confirmEmailHtml(confirmUrl, to),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error: ${body}`);
  }
}

export async function POST(req: Request) {
  const rl = rateLimit(`signup:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, password, role, origin } = parsed.data;

  // Check for existing account
  const { data: rows, error: lookupErr } = await admin().rpc("auth_email_exists", { p_email: email });
  if (!lookupErr) {
    const existing = (rows as Array<{ user_id: string; user_meta: Record<string, unknown> }> | null)?.[0] ?? null;
    if (existing) {
      return NextResponse.json(
        { error: "There is already an account with this email. Log in instead, or reset your password." },
        { status: 409 },
      );
    }
  }

  const sb = admin();

  // Create the user via admin (skips Supabase's broken SMTP)
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    password,
    user_metadata: { role },
    email_confirm: false,
  });

  const redirectTo = origin ? `${origin}/auth/callback` : undefined;

  if (createErr) {
    console.error("[signup] createUser error:", createErr.message);
    const isDuplicate =
      /already registered|user already exists/i.test(createErr.message) ||
      !createErr.message ||
      createErr.message === "{}";

    if (isDuplicate) {
      // Unconfirmed orphan from a previous failed attempt — resend the link
      const { data: ld } = await sb.auth.admin.generateLink({
        type: "signup",
        email,
        password,
        options: { ...(redirectTo ? { redirectTo } : {}) },
      });
      if (ld?.properties?.action_link) {
        try { await sendConfirmEmail(email, ld.properties.action_link); } catch {}
        return NextResponse.json({ ok: true, needsVerification: true });
      }
      return NextResponse.json(
        { error: "There is already an account with this email. Log in instead, or reset your password." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: createErr.message || "Signup failed — please try again." }, { status: 400 });
  }

  // Generate the confirmation link and send it via Resend directly
  const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { ...(redirectTo ? { redirectTo } : {}) },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error("[signup] generateLink error:", linkErr?.message);
    // User was created — they can request a resend from the check-inbox screen
    return NextResponse.json({ ok: true, needsVerification: true });
  }

  try {
    await sendConfirmEmail(email, linkData.properties.action_link);
  } catch (emailErr) {
    console.error("[signup] Resend error:", emailErr instanceof Error ? emailErr.message : emailErr);
    // Still return success — user exists; they can resend from the check-inbox screen
  }

  return NextResponse.json({ ok: true, needsVerification: true });
}
