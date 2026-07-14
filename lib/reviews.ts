import { createClient } from "@/lib/supabase/server";

export async function getRatingsByPhotographerId(
  photographerIds: string[],
): Promise<Map<string, { avgRating: number; reviewCount: number }>> {
  const ratings = new Map<string, { avgRating: number; reviewCount: number }>();
  if (photographerIds.length === 0) return ratings;

  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("photographer_id, rating")
    .in("photographer_id", photographerIds);

  const sums = new Map<string, { total: number; count: number }>();
  for (const r of data ?? []) {
    const entry = sums.get(r.photographer_id) ?? { total: 0, count: 0 };
    entry.total += r.rating;
    entry.count += 1;
    sums.set(r.photographer_id, entry);
  }

  for (const [id, { total, count }] of sums) {
    ratings.set(id, { avgRating: total / count, reviewCount: count });
  }

  return ratings;
}
