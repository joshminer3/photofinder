import { createClient } from "@/lib/supabase/server";

export type ConversationSummary = {
  id: string;
  otherName: string;
  otherAvatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  hasUnread: boolean;
};

export async function getConversationSummaries(
  userId: string,
  photographerProfileId: string | null,
): Promise<ConversationSummary[]> {
  const supabase = await createClient();

  const orClause = photographerProfileId
    ? `client_id.eq.${userId},photographer_id.eq.${photographerProfileId}`
    : `client_id.eq.${userId}`;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, client_id, photographer_id, created_at")
    .or(orClause);

  if (!conversations || conversations.length === 0) return [];

  const conversationIds = conversations.map((c) => c.id);

  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, read_at, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const lastByConversation = new Map<string, NonNullable<typeof messages>[number]>();
  const hasUnreadByConversation = new Map<string, boolean>();
  for (const m of messages ?? []) {
    if (!lastByConversation.has(m.conversation_id)) {
      lastByConversation.set(m.conversation_id, m);
    }
    if (m.sender_id !== userId && m.read_at === null) {
      hasUnreadByConversation.set(m.conversation_id, true);
    }
  }

  const photographerIdsNeeded = conversations
    .filter((c) => c.client_id === userId)
    .map((c) => c.photographer_id);
  const clientIdsNeeded = conversations
    .filter((c) => c.photographer_id === photographerProfileId)
    .map((c) => c.client_id);

  const photographerMap = new Map<
    string,
    { full_name: string | null; avatar_url: string | null }
  >();
  if (photographerIdsNeeded.length > 0) {
    const { data: photographers } = await supabase
      .from("photographer_profiles")
      .select("id, profiles(full_name, avatar_url)")
      .in("id", photographerIdsNeeded);
    for (const p of photographers ?? []) {
      photographerMap.set(p.id, {
        full_name: p.profiles?.full_name ?? null,
        avatar_url: p.profiles?.avatar_url ?? null,
      });
    }
  }

  const clientMap = new Map<
    string,
    { full_name: string | null; avatar_url: string | null }
  >();
  if (clientIdsNeeded.length > 0) {
    const { data: clients } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", clientIdsNeeded);
    for (const c of clients ?? []) {
      clientMap.set(c.id, { full_name: c.full_name, avatar_url: c.avatar_url });
    }
  }

  const summaries: ConversationSummary[] = conversations.map((c) => {
    const isClient = c.client_id === userId;
    const other = isClient
      ? photographerMap.get(c.photographer_id)
      : clientMap.get(c.client_id);
    const last = lastByConversation.get(c.id);
    return {
      id: c.id,
      otherName: other?.full_name ?? "Unknown",
      otherAvatarUrl: other?.avatar_url ?? null,
      lastMessage: last?.content ?? null,
      lastMessageAt: last?.created_at ?? c.created_at,
      hasUnread: hasUnreadByConversation.get(c.id) ?? false,
    };
  });

  summaries.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );

  return summaries;
}
