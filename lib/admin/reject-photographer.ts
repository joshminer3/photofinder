import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { rejectedEmail } from "@/lib/email/templates/rejected";

export async function rejectPhotographer(photographerId: string, reason: string | null) {
  const supabase = createAdminClient();

  const { data: photographer } = await supabase
    .from("photographer_profiles")
    .select("id, user_id, profiles(full_name)")
    .eq("id", photographerId)
    .single();

  if (!photographer) return { status: "not_found" as const };

  await supabase
    .from("photographer_profiles")
    .update({ rejected_at: new Date().toISOString(), rejection_reason: reason })
    .eq("id", photographerId);
  await supabase.from("profiles").update({ is_approved: false }).eq("id", photographer.user_id);

  const name = photographer.profiles?.full_name ?? "Photographer";

  // Fire-and-forget — the rejection itself already succeeded above; don't
  // make the admin wait on Resend's round-trip to see the UI update.
  notifyRejected(supabase, photographer.user_id, name, reason).catch((err) =>
    console.error("[reject-photographer] failed to send rejection email:", err),
  );

  return { status: "rejected" as const, name };
}

async function notifyRejected(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  name: string,
  reason: string | null,
) {
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email;
  if (!email) return;

  const { subject, html } = rejectedEmail({ firstName: name.split(" ")[0] || name, reason });
  await sendEmail({ to: email, subject, html });
}
