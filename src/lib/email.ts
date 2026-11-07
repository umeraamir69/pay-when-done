/**
 * Optional transactional email via Resend.
 * Configure RESEND_API_KEY (+ optional RESEND_FROM_EMAIL) on Vercel to enable
 * magic-link passwordless sign-in. Without the key, passkeys remain the
 * passwordless path and magic-link UI stays hidden.
 */

export function isEmailAuthConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "PayWhenDone <onboarding@resend.dev>"
  );
}

export async function sendAuthEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Email sign-in is not configured. Set RESEND_API_KEY (and optional RESEND_FROM_EMAIL) on the host.",
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[email] Resend failed", res.status, body.slice(0, 200));
    throw new Error("Could not send email. Try passkey or email + password.");
  }
}

export async function sendMagicLinkEmail(data: {
  email: string;
  url: string;
}): Promise<void> {
  const safeUrl = data.url;
  await sendAuthEmail({
    to: data.email,
    subject: "Your PayWhenDone sign-in link",
    text:
      "Sign in to PayWhenDone:\n\n" +
      safeUrl +
      "\n\nThis link expires shortly. If you did not request it, ignore this email.",
    html: [
      '<div style="font-family:Georgia,serif;line-height:1.5;color:#1a1a1a;max-width:480px">',
      '<p style="font-size:18px;margin:0 0 12px">Sign in to <strong>PayWhenDone</strong></p>',
      '<p style="margin:0 0 20px;color:#444">Use this one-time link. It expires in a few minutes.</p>',
      '<p style="margin:0 0 24px">',
      `<a href="${safeUrl}" style="display:inline-block;background:#0b3d2e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px">`,
      "Continue to PayWhenDone",
      "</a>",
      "</p>",
      `<p style="font-size:13px;color:#666;margin:0">If the button does not work, paste this URL into your browser:<br/>${safeUrl}</p>`,
      "</div>",
    ].join(""),
  });
}
