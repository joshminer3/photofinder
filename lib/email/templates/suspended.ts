import { escapeHtml } from "@/lib/email/escape-html";

export function suspendedEmail({ firstName }: { firstName: string }) {
  return {
    subject: "Your Foto profile has been suspended",
    html: `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Your Foto profile has been suspended and is no longer visible to clients.</p>
      <p>If you believe this was a mistake, reply to this email and we'll take a look.</p>
      <p>— Josh at Foto</p>
    `,
  };
}
