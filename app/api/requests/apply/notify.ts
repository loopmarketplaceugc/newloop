// Email notification sent to a brand when a creator applies to one of their
// requests. Best-effort: a failure here never blocks the application itself.

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function newApplicantEmailHtml(p: { creatorName: string; requestTitle: string; reviewUrl: string }) {
  const creator = escapeHtml(p.creatorName);
  const title = escapeHtml(p.requestTitle);
  const url = escapeHtml(p.reviewUrl);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f4ef;color:#101805;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f6f4ef;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #ded8cb;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:28px 30px 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:900;">
                Loop<span style="font-size:11px;vertical-align:super;">&reg;</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 30px 0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:900;line-height:1.02;">
                New applicant.
              </td>
            </tr>
            <tr>
              <td style="padding:16px 30px 0;font-size:15px;line-height:1.55;color:#4d5642;">
                <strong>${creator}</strong> just applied to your request <strong>&ldquo;${title}&rdquo;</strong>. Review their profile and approve or decline right in your dashboard.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 30px 4px;">
                <a href="${url}" style="display:inline-block;background:#101805;color:#a8d98a;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:900;font-family:Georgia,'Times New Roman',serif;">
                  Review applicant &rarr;
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 30px 28px;font-size:13px;line-height:1.5;color:#737b68;">
                You&rsquo;re receiving this because you posted a request on Loop.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Notify a brand by email that a creator applied. No-op if email isn't configured. */
export async function sendNewApplicantEmail(p: {
  to: string | null | undefined;
  creatorName: string;
  requestTitle: string;
  reviewUrl: string;
}): Promise<{ emailed: boolean; reason: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !p.to) return { emailed: false, reason: "email-not-configured" };

  const from = process.env.EMAIL_FROM ?? "Loop <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to: p.to,
      subject: `New applicant for "${p.requestTitle}" on Loop`,
      html: newApplicantEmailHtml({ creatorName: p.creatorName, requestTitle: p.requestTitle, reviewUrl: p.reviewUrl }),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!res.ok) return { emailed: false, reason: (await res.text()).slice(0, 500) };
  return { emailed: true, reason: null };
}
