import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateApprovalToken } from "@/lib/admin/token";
import { sendEmail } from "@/lib/email/send";
import { submissionEmail } from "@/lib/email/templates/submission";

// Called by the client right after onboarding submission finishes. Uses the
// cookie-based server client (not the service-role client) so RLS enforces
// that only the profile's own owner can trigger this for their photographer_id.
export async function POST(request: Request) {
  const { photographerId } = await request.json();
  if (!photographerId) {
    return NextResponse.json({ error: "Missing photographerId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photographer, error } = await supabase
    .from("photographer_profiles")
    .select("id, slug, bio, primary_specialty, service_area, user_id, profiles(full_name)")
    .eq("id", photographerId)
    .single();

  if (error || !photographer || photographer.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "ADMIN_EMAIL not configured" }, { status: 500 });
  }

  const { subject, html } = submissionEmail({
    name: photographer.profiles?.full_name ?? "A photographer",
    primarySpecialty: photographer.primary_specialty,
    serviceArea: photographer.service_area,
    bio: photographer.bio,
    slug: photographer.slug,
    photographerId: photographer.id,
    approvalToken: generateApprovalToken(photographer.id),
  });

  try {
    await sendEmail({ to: process.env.ADMIN_EMAIL, subject, html });
  } catch (err) {
    console.error("[notify-submission] failed to send email:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
