import { createClient } from "@/lib/supabase/server";

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
