import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  messagesReceived: number;
  unreadCount: number;
  avgRating: number | null;
  reviewCount: number;
};

export async function getDashboardStats(
  photographerId: string,
  userId: string,
): Promise<DashboardStats> {
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("photographer_id", photographerId);

  const conversationIds = (conversations ?? []).map((c) => c.id);

  let messagesReceived = 0;
  let unreadCount = 0;
  if (conversationIds.length > 0) {
    const [{ count: totalCount }, { count: unread }] = await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", userId),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", userId)
        .is("read_at", null),
    ]);
    messagesReceived = totalCount ?? 0;
    unreadCount = unread ?? 0;
  }

  const { data: ratings } = await supabase
    .from("reviews")
    .select("rating")
    .eq("photographer_id", photographerId);

  const reviewCount = ratings?.length ?? 0;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (ratings!.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10,
        ) / 10
      : null;

  return { messagesReceived, unreadCount, avgRating, reviewCount };
}
