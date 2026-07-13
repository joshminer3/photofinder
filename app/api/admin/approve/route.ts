import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyApprovalToken } from "@/lib/admin/token";
import { sendEmail } from "@/lib/email/send";
import { approvedEmail } from "@/lib/email/templates/approved";
import { escapeHtml } from "@/lib/email/escape-html";

function htmlResponse(status: number, message: string) {
  return new NextResponse(
    `<!doctype html><html><body style="font-family: sans-serif; padding: 2rem;"><p>${message}</p></body></html>`,
    { status, headers: { "Content-Type": "text/html" } },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const photographerId = searchParams.get("photographer_id");
  const token = searchParams.get("token");

  if (!photographerId || !token) {
    return htmlResponse(400, "Missing photographer_id or token.");
  }

  if (!verifyApprovalToken(photographerId, token)) {
    return htmlResponse(403, "Invalid or expired approval link.");
  }

  const supabase = createAdminClient();

  const { data: photographer, error: fetchError } = await supabase
    .from("photographer_profiles")
    .select("id, slug, user_id, profiles(full_name, is_approved)")
    .eq("id", photographerId)
    .single();

  if (fetchError || !photographer) {
    return htmlResponse(404, "Photographer profile not found.");
  }

  const name = photographer.profiles?.full_name ?? "Photographer";

  if (photographer.profiles?.is_approved) {
    return htmlResponse(200, `Already approved. ${escapeHtml(name)} is live.`);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", photographer.user_id);

  if (updateError) {
    return htmlResponse(500, "Failed to approve profile. Try again.");
  }

  const { data: userData } = await supabase.auth.admin.getUserById(
    photographer.user_id,
  );
  const email = userData?.user?.email;

  if (email) {
    const { subject, html } = approvedEmail({
      firstName: name.split(" ")[0] || name,
      slug: photographer.slug,
    });
    try {
      await sendEmail({ to: email, subject, html });
    } catch (err) {
      console.error("[approve] failed to send approval email:", err);
    }
  }

  return htmlResponse(200, `Approved! ${escapeHtml(name)} has been notified.`);
}
