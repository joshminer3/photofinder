import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SearchPhotographer } from "@/components/search/PhotographerCard";
import { SearchResults } from "@/components/search/SearchResults";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/saved");
  }

  const { data: saved } = await supabase
    .from("saved_photographers")
    .select(
      "photographer_profiles(slug, primary_specialty, service_area, price_range_min, price_range_max, available_this_month, bio, profiles(full_name, avatar_url))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const photographers: SearchPhotographer[] = (saved ?? [])
    .map((row) => row.photographer_profiles)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      slug: p.slug,
      primary_specialty: p.primary_specialty,
      service_area: p.service_area,
      price_range_min: p.price_range_min,
      price_range_max: p.price_range_max,
      available_this_month: p.available_this_month,
      bio: p.bio,
      full_name: p.profiles?.full_name ?? "Photographer",
      avatar_url: p.profiles?.avatar_url ?? null,
    }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Saved photographers</h1>
      {photographers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No saved photographers yet.
          <br />
          Browse photographers and save the ones you like.
        </div>
      ) : (
        <SearchResults photographers={photographers} />
      )}
    </div>
  );
}
