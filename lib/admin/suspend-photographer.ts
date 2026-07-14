import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { suspendedEmail } from "@/lib/email/templates/suspended";

export async function suspendPhotographer(photographerId: string) {
  const supabase = createAdminClient();

  const { data: photographer } = await supabase
    .from("photographer_profiles")
    .select("id, user_id, profiles(full_name)")
    .eq("id", photographerId)
    .single();

  if (!photographer) return { status: "not_found" as const };

  await supabase
    .from("photographer_profiles")
    .update({ suspended_at: new Date().toISOString() })
    .eq("id", photographerId);
  await supabase.from("profiles").update({ is_approved: false }).eq("id", photographer.user_id);

  const name = photographer.profiles?.full_name ?? "Photographer";

  // Fire-and-forget — the suspension itself already succeeded above; don't
  // make the admin wait on Resend's round-trip to see the UI update.
  notifySuspended(supabase, photographer.user_id, name).catch((err) =>
    console.error("[suspend-photographer] failed to send suspension email:", err),
  );

  return { status: "suspended" as const, name };
}

async function notifySuspended(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  name: string,
) {
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email;
  if (!email) return;

  const { subject, html } = suspendedEmail({ firstName: name.split(" ")[0] || name });
  await sendEmail({ to: email, subject, html });
}
