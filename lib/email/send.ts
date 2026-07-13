import { Resend } from "resend";

// Resend's shared onboarding@resend.dev sender works without a verified
// domain, but only delivers to the email address on the Resend account
// itself — fine for dev, swap for a verified domain before real users rely
// on this (see BRIEF_SESSION_2.md).
const FROM_ADDRESS = "Foto <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[email] RESEND_API_KEY not set, skipping send:", {
      to,
      subject,
    });
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
