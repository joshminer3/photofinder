import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/components/dashboard/profile-edit-form";
import { ViewProfileButton } from "@/components/dashboard/view-profile-button";

export default async function DashboardProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirects; satisfies TS

  const [{ data: profile }, { data: photographer }, { data: specialties }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single(),
      supabase
        .from("photographer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single(),
      supabase.from("specialties").select("*").order("name"),
    ]);

  if (!photographer) return null; // layout already redirects to /onboarding

  const { data: portfolioItemsRaw } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("photographer_id", photographer.id)
    .order("display_order");

  const portfolioItems = (portfolioItemsRaw ?? []).map((item) => ({
    id: item.id,
    type: item.type as "photo" | "video",
    storagePath: item.storage_path,
    displayOrder: item.display_order,
    url: supabase.storage.from("portfolios").getPublicUrl(item.storage_path).data
      .publicUrl,
  }));

  return (
    <div style={{ padding: "24px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 500, color: "#111010", letterSpacing: "-0.5px" }}>
            Edit your profile
          </h1>
          <p style={{ fontSize: "12px", color: "#7A7572", marginTop: "2px" }}>
            Changes save immediately when you click Save changes.
          </p>
        </div>
        <ViewProfileButton slug={photographer.slug} />
      </div>

      <div className="max-w-2xl">
        <ProfileEditForm
          userId={user.id}
          photographerId={photographer.id}
          specialties={specialties ?? []}
          initialData={{
            fullName: profile?.full_name ?? "",
            avatarUrl: profile?.avatar_url ?? null,
            bio: photographer.bio ?? "",
            serviceArea: photographer.service_area ?? "",
            state: photographer.state ?? "",
            primarySpecialty: photographer.primary_specialty,
            secondarySpecialty1: photographer.secondary_specialty_1 ?? "",
            secondarySpecialty2: photographer.secondary_specialty_2 ?? "",
            priceMin: photographer.price_range_min?.toString() ?? "",
            priceMax: photographer.price_range_max?.toString() ?? "",
            availableThisMonth: photographer.available_this_month,
            instagramUrl: photographer.instagram_url ?? "",
            websiteUrl: photographer.website_url ?? "",
            otherLinkUrl: photographer.other_link_url ?? "",
            otherLinkLabel: photographer.other_link_label ?? "",
            publicEmail: photographer.public_email ?? "",
            publicPhone: photographer.public_phone ?? "",
            portfolioItems,
          }}
        />
      </div>
    </div>
  );
}
