import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  email: z.string().email().max(320),
});

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://nylivxiyzxjdjsbdmrnw.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55bGl2eGl5enhqZGpzYmRtcm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0Mzc3ODUsImV4cCI6MjA5ODAxMzc4NX0.gr4KBqv9Wdjk_JG3cUb4MkJtjILvwjQarlOe6k5LDkQ";

function siteUrl(req: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^/, "https://") ??
    new URL(req.url).origin
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetEmailHtml(resetUrl: string, email: string) {
  const safeUrl = escapeHtml(resetUrl);
  const safeEmail = escapeHtml(email);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#101805;color:#faf6ef;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101805;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:3px solid #faf6ef;border-radius:28px;background:#f2a3df;color:#101805;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:900;line-height:1;">
                Loop<span style="font-size:12px;vertical-align:super;">&reg;</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0;font-family:Georgia,'Times New Roman',serif;font-size:52px;font-weight:900;line-height:.92;letter-spacing:-1.5px;">
                Reset your password.
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0;font-size:16px;line-height:1.5;font-weight:700;">
                We got a password reset request for <span style="font-family:monospace;">${safeEmail}</span>.
                Tap the button below and choose a new one.
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <a href="${safeUrl}" style="display:inline-block;background:#101805;color:#a8d98a;text-decoration:none;border-radius:999px;padding:16px 24px;font-size:18px;font-weight:900;font-family:Georgia,'Times New Roman',serif;">
                  Choose a new password
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;font-size:13px;line-height:1.5;font-weight:700;color:rgba(16,24,5,.65);">
                This link expires soon. If you didn’t ask for this, ignore the email and your password stays the same.
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

async function sendResendEmail(params: { to: string; resetUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.EMAIL_FROM ?? "Loop <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: "Reset your Loop password",
      html: resetEmailHtml(params.resetUrl, params.to),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Resend failed: ${message}`);
  }
  return true;
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const redirectTo = `${siteUrl(req)}/update-password`;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    if (serviceRole && process.env.RESEND_API_KEY) {
      const admin = createClient(SUPABASE_URL, serviceRole, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      if (error) throw new Error(error.message);
      const resetUrl = data.properties?.action_link;
      if (!resetUrl) throw new Error("Supabase did not return a reset link.");
      await sendResendEmail({ to: email, resetUrl });
      return NextResponse.json({ ok: true, mode: "branded" });
    }

    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await anon.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, mode: "supabase-fallback" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send reset email." },
      { status: 500 },
    );
  }
}
