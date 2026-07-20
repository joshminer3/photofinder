import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavHeader } from "@/components/nav-header";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_photographer, full_name")
    .eq("id", user.id)
    .single();
  if (!profile?.is_photographer) redirect("/");

  const { data: photographerProfile } = await supabase
    .from("photographer_profiles")
    .select("slug, primary_specialty")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!photographerProfile) redirect("/onboarding");

  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      <div className="flex flex-1 flex-col md:flex-row" style={{ background: "#FDFCFB" }}>
        <DashboardNav
          photographerName={profile?.full_name ?? "Photographer"}
          specialty={photographerProfile.primary_specialty}
          slug={photographerProfile.slug}
        />
        <main className="dashboard-page min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
