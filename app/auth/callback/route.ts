import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect back from Supabase after email-link or OAuth sign-in.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role"); // "client" | "photographer", set on signup only
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (role === "photographer" || role === "client") {
        await supabase
          .from("profiles")
          .update({ is_photographer: role === "photographer" })
          .eq("id", data.user.id);
      }

      const redirectTo =
        role === "photographer" ? "/onboarding" : next;
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
