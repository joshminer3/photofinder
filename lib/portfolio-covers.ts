import { createClient } from "@/lib/supabase/server";

export async function getPortfolioImagesByPhotographerId(
  photographerIds: string[],
  limit = 5,
): Promise<Map<string, string[]>> {
  const images = new Map<string, string[]>();
  if (photographerIds.length === 0) return images;

  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_items")
    .select("photographer_id, storage_path")
    .in("photographer_id", photographerIds)
    .eq("type", "photo")
    .order("display_order", { ascending: true });

  for (const item of data ?? []) {
    const existing = images.get(item.photographer_id) ?? [];
    if (existing.length >= limit) continue;
    existing.push(
      supabase.storage.from("portfolios").getPublicUrl(item.storage_path).data.publicUrl,
    );
    images.set(item.photographer_id, existing);
  }

  return images;
}

export async function getCoverImagesByPhotographerId(
  photographerIds: string[],
): Promise<Map<string, string>> {
  const covers = new Map<string, string>();
  if (photographerIds.length === 0) return covers;

  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_items")
    .select("photographer_id, storage_path")
    .in("photographer_id", photographerIds)
    .eq("type", "photo")
    .order("display_order", { ascending: true });

  for (const item of data ?? []) {
    if (!covers.has(item.photographer_id)) {
      covers.set(
        item.photographer_id,
        supabase.storage.from("portfolios").getPublicUrl(item.storage_path).data.publicUrl,
      );
    }
  }

  return covers;
}
