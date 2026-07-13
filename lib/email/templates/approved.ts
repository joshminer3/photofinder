import { escapeHtml } from "@/lib/email/escape-html";

export function approvedEmail({
  firstName,
  slug,
}: {
  firstName: string;
  slug: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const profileUrl = `${appUrl}/photographer/${slug}`;

  return {
    subject: "You're live on Foto 🎉",
    html: `
      <p>Hey ${escapeHtml(firstName)},</p>
      <p>Your Foto profile has been approved and is now live.</p>
      <p>View your profile:<br><a href="${profileUrl}">${profileUrl}</a></p>
      <p>Share this link with clients — anyone can find and contact you through it.</p>
      <p>As photographers join and clients start searching, you'll receive messages directly through the app. We'll email you when someone reaches out.</p>
      <p>— Josh at Foto</p>
    `,
  };
}
