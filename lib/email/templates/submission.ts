import { escapeHtml } from "@/lib/email/escape-html";

export function submissionEmail({
  name,
  primarySpecialty,
  serviceArea,
  bio,
  slug,
  photographerId,
  approvalToken,
}: {
  name: string;
  primarySpecialty: string;
  serviceArea: string | null;
  bio: string | null;
  slug: string;
  photographerId: string;
  approvalToken: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const previewUrl = `${appUrl}/photographer/${slug}`;
  const approveUrl = `${appUrl}/api/admin/approve?photographer_id=${photographerId}&token=${approvalToken}`;

  return {
    subject: `New photographer submitted: ${name}`,
    html: `
      <p>${escapeHtml(name)} just submitted their photographer profile for review.</p>
      <p>
        Specialty: ${escapeHtml(primarySpecialty)}<br>
        Location: ${escapeHtml(serviceArea ?? "—")}<br>
        Bio: ${escapeHtml(bio ?? "—")}
      </p>
      <p>View their profile preview:<br><a href="${previewUrl}">${previewUrl}</a></p>
      <p>Approve their profile:<br><a href="${approveUrl}">${approveUrl}</a></p>
      <p>—<br>Foto Admin</p>
    `,
  };
}
