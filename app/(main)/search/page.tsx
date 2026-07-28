import { createClient } from "@/lib/supabase/server";
import { getRatingsByPhotographerId } from "@/lib/reviews";
import { getCoverImagesByPhotographerId } from "@/lib/portfolio-covers";
import { FilterBar } from "@/components/search/FilterBar";
import { SortPills } from "@/components/search/SortPills";
import { SearchListCard, type SearchListCardData } from "@/components/search/SearchListCard";
import { EmptyState } from "@/components/search/EmptyState";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const specialtySlug =
    typeof params.specialty === "string" ? params.specialty : undefined;
  const state = typeof params.state === "string" ? params.state : undefined;
  const priceMin =
    typeof params.price_min === "string" ? Number(params.price_min) : undefined;
  const priceMax =
    typeof params.price_max === "string" ? Number(params.price_max) : undefined;
  const available = params.available === "true";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const hasAnyFilter = Boolean(specialtySlug || state || priceMin || priceMax || available);

  const supabase = await createClient();

  const [{ data: specialties }, { data: { user } }] = await Promise.all([
    supabase.from("specialties").select("*").order("name"),
    supabase.auth.getUser(),
  ]);

  const specialtyName = specialtySlug
    ? specialties?.find((s) => s.slug === specialtySlug)?.name
    : undefined;

  let query = supabase
    .from("photographer_profiles")
    .select(
      "id, slug, bio, primary_specialty, secondary_specialty_1, service_area, price_range_min, available_this_month, profiles!inner(full_name, is_approved, is_photographer)",
    )
    .eq("profiles.is_approved", true)
    .eq("profiles.is_photographer", true)
    .order("created_at", { ascending: false });

  if (specialtyName) query = query.eq("primary_specialty", specialtyName);
  if (state) query = query.eq("state", state);
  if (priceMax !== undefined && !Number.isNaN(priceMax))
    query = query.lte("price_range_min", priceMax);
  if (priceMin !== undefined && !Number.isNaN(priceMin))
    query = query.gte("price_range_max", priceMin);
  if (available) query = query.eq("available_this_month", true);

  const { data: results } = await query;
  const photographerIds = (results ?? []).map((r) => r.id);

  const [ratings, covers] = await Promise.all([
    getRatingsByPhotographerId(photographerIds),
    getCoverImagesByPhotographerId(photographerIds),
  ]);

  const photographers: SearchListCardData[] = (results ?? []).map((r) => ({
    photographerId: r.id,
    slug: r.slug,
    fullName: r.profiles?.full_name ?? "Photographer",
    bio: r.bio,
    primarySpecialty: r.primary_specialty,
    secondarySpecialty: r.secondary_specialty_1,
    serviceArea: r.service_area,
    priceRangeMin: r.price_range_min,
    availableThisMonth: r.available_this_month,
    coverUrl: covers.get(r.id) ?? null,
    avgRating: ratings.get(r.id)?.avgRating ?? null,
    reviewCount: ratings.get(r.id)?.reviewCount ?? 0,
  }));

  if (sort === "price") {
    photographers.sort((a, b) => {
      if (a.priceRangeMin == null) return 1;
      if (b.priceRangeMin == null) return -1;
      return a.priceRangeMin - b.priceRangeMin;
    });
  } else if (sort === "rating") {
    photographers.sort((a, b) => {
      if (a.avgRating == null) return 1;
      if (b.avgRating == null) return -1;
      return b.avgRating - a.avgRating;
    });
  }

  return (
    <div style={{ background: "#FDFCFB" }} className="min-h-[calc(100vh-4rem)]">
      <FilterBar specialties={specialties ?? []} />

      <div
        className="mx-auto flex max-w-6xl items-center justify-between gap-4"
        style={{ padding: "14px 24px 0" }}
      >
        <p style={{ fontSize: "12px", color: "#7A7572" }}>
          {photographers.length} photographer{photographers.length === 1 ? "" : "s"} found
        </p>
        <SortPills />
      </div>

      {photographers.length === 0 ? (
        <EmptyState hasAnyFilter={hasAnyFilter} />
      ) : (
        <div
          className="mx-auto grid max-w-6xl grid-cols-1 gap-3 lg:grid-cols-2"
          style={{ padding: "16px 24px 48px" }}
        >
          {photographers.map((p) => (
            <SearchListCard key={p.slug} photographer={p} isLoggedIn={Boolean(user)} />
          ))}
        </div>
      )}
    </div>
  );
}
