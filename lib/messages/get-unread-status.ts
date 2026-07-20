import { createClient } from "@/lib/supabase/server";

export async function hasUnreadMessages(
  userId: string,
  photographerProfileId: string | null,
): Promise<boolean> {
  const supabase = await createClient();

  const orClause = photographerProfileId
    ? `client_id.eq.${userId},photographer_id.eq.${photographerProfileId}`
    : `client_id.eq.${userId}`;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .or(orClause);

  const conversationIds = (conversations ?? []).map((c) => c.id);
  if (conversationIds.length === 0) return false;

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", conversationIds)
    .neq("sender_id", userId)
    .is("read_at", null);

  return (count ?? 0) > 0;
}
