import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { approvedEmail } from "@/lib/email/templates/approved";

export type ApprovePhotographerResult =
  | { status: "not_found" }
  | { status: "already_approved"; name: string }
  | { status: "approved"; name: string };

export async function approvePhotographer(
  photographerId: string,
): Promise<ApprovePhotographerResult> {
  const supabase = createAdminClient();

  const { data: photographer } = await supabase
    .from("photographer_profiles")
    .select("id, slug, user_id, profiles(full_name, is_approved)")
    .eq("id", photographerId)
    .single();

  if (!photographer) return { status: "not_found" };

  const name = photographer.profiles?.full_name ?? "Photographer";

  if (photographer.profiles?.is_approved) {
    return { status: "already_approved", name };
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ is_approved: true })
    .eq("id", photographer.user_id);
  if (profileUpdateError) {
    console.error("[approve-photographer] profile update failed:", profileUpdateError);
  }

  const { error: photographerUpdateError } = await supabase
    .from("photographer_profiles")
    .update({ rejected_at: null, rejection_reason: null, suspended_at: null })
    .eq("id", photographerId);
  if (photographerUpdateError) {
    console.error(
      "[approve-photographer] photographer_profiles update failed:",
      photographerUpdateError,
    );
  }

  // Fire-and-forget — the approval itself already succeeded above; don't
  // make the admin wait on Resend's round-trip to see the UI update.
  notifyApproved(supabase, photographer.user_id, photographer.slug, name).catch((err) =>
    console.error("[approve-photographer] failed to send approval email:", err),
  );

  return { status: "approved", name };
}

async function notifyApproved(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  slug: string,
  name: string,
) {
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email;
  if (!email) return;

  const { subject, html } = approvedEmail({
    firstName: name.split(" ")[0] || name,
    slug,
  });
  await sendEmail({ to: email, subject, html });
}
