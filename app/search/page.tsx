import { createClient } from "@/lib/supabase/server";
import { getRatingsByPhotographerId } from "@/lib/reviews";
import { FilterPanel } from "@/components/search/FilterPanel";
import { SearchResults } from "@/components/search/SearchResults";
import type { SearchPhotographer } from "@/components/search/PhotographerCard";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const specialtySlug =
    typeof params.specialty === "string" ? params.specialty : undefined;
  const location = typeof params.location === "string" ? params.location : undefined;
  const priceMin =
    typeof params.price_min === "string" ? Number(params.price_min) : undefined;
  const priceMax =
    typeof params.price_max === "string" ? Number(params.price_max) : undefined;
  const available = params.available === "true";

  const supabase = await createClient();

  const { data: specialties } = await supabase
    .from("specialties")
    .select("*")
    .order("name");

  const specialtyName = specialtySlug
    ? specialties?.find((s) => s.slug === specialtySlug)?.name
    : undefined;

  let query = supabase
    .from("photographer_profiles")
    .select(
      "id, slug, primary_specialty, service_area, price_range_min, price_range_max, available_this_month, bio, profiles!inner(full_name, avatar_url, is_approved, is_photographer)",
    )
    .eq("profiles.is_approved", true)
    .eq("profiles.is_photographer", true)
    .order("created_at", { ascending: false });

  if (specialtyName) query = query.eq("primary_specialty", specialtyName);
  if (location) query = query.ilike("service_area", `%${location}%`);
  if (priceMax !== undefined && !Number.isNaN(priceMax))
    query = query.lte("price_range_min", priceMax);
  if (priceMin !== undefined && !Number.isNaN(priceMin))
    query = query.gte("price_range_max", priceMin);
  if (available) query = query.eq("available_this_month", true);

  const { data: results } = await query;
  const ratings = await getRatingsByPhotographerId((results ?? []).map((r) => r.id));

  const photographers: SearchPhotographer[] = (results ?? []).map((r) => ({
    slug: r.slug,
    primary_specialty: r.primary_specialty,
    service_area: r.service_area,
    price_range_min: r.price_range_min,
    price_range_max: r.price_range_max,
    available_this_month: r.available_this_month,
    bio: r.bio,
    full_name: r.profiles?.full_name ?? "Photographer",
    avatar_url: r.profiles?.avatar_url ?? null,
    avgRating: ratings.get(r.id)?.avgRating,
    reviewCount: ratings.get(r.id)?.reviewCount,
  }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Find a photographer</h1>
      <FilterPanel specialties={specialties ?? []} />
      <SearchResults photographers={photographers} />
    </div>
  );
}
