import { createClient } from "@/lib/supabase/server";

// Two layers of protection per the brief: the DB is_admin flag, AND a
// hardcoded ADMIN_USER_ID env var as a fallback safety net. Both must pass.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (!process.env.ADMIN_USER_ID || user.id !== process.env.ADMIN_USER_ID) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return null;

  return user;
}
