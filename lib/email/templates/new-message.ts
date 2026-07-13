import { escapeHtml } from "@/lib/email/escape-html";

export function newMessageEmail({
  senderName,
  messagePreview,
  conversationId,
}: {
  senderName: string;
  messagePreview: string;
  conversationId: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const conversationUrl = `${appUrl}/messages/${conversationId}`;
  const preview =
    messagePreview.length > 200 ? `${messagePreview.slice(0, 200)}…` : messagePreview;

  return {
    subject: `New message from ${senderName} on Foto`,
    html: `
      <p>${escapeHtml(senderName)} sent you a message:</p>
      <p>"${escapeHtml(preview)}"</p>
      <p>Reply on Foto:<br><a href="${conversationUrl}">${conversationUrl}</a></p>
      <p>— Foto</p>
    `,
  };
}
