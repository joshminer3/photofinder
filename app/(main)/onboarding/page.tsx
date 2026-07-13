import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingProvider } from "@/components/onboarding/onboarding-context";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: existingPhotographerProfile }, { data: specialties }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single(),
      supabase
        .from("photographer_profiles")
        .select("slug")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("specialties").select("*").order("name"),
    ]);

  if (existingPhotographerProfile) {
    redirect(`/photographer/${existingPhotographerProfile.slug}`);
  }

  return (
    <OnboardingProvider
      userId={user.id}
      specialties={specialties ?? []}
      initialFullName={
        profile?.full_name ?? user.user_metadata.full_name ?? ""
      }
      initialAvatarUrl={profile?.avatar_url ?? null}
    >
      <OnboardingFlow />
    </OnboardingProvider>
  );
}
