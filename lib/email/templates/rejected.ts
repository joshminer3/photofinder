import { escapeHtml } from "@/lib/email/escape-html";

export function rejectedEmail({
  firstName,
  reason,
}: {
  firstName: string;
  reason: string | null;
}) {
  return {
    subject: "Your Foto profile submission",
    html: `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thank you for submitting your profile to Foto.</p>
      <p>After review, we weren't able to approve your profile at this time.</p>
      ${reason ? `<p>Reason: ${escapeHtml(reason)}</p>` : ""}
      <p>You're welcome to update your profile and resubmit.</p>
      <p>If you have questions, reply to this email.</p>
      <p>— Josh at Foto</p>
    `,
  };
}
