import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationThread } from "@/components/messages/conversation-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      "id, client_id, photographer_id, profiles!conversations_client_id_fkey(full_name, avatar_url), photographer_profiles(user_id, slug, primary_specialty, service_area, profiles(full_name, avatar_url))",
    )
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  const isClient = conversation.client_id === user.id;
  const other = isClient
    ? {
        name: conversation.photographer_profiles?.profiles?.full_name ?? "Photographer",
        avatarUrl: conversation.photographer_profiles?.profiles?.avatar_url ?? null,
        slug: conversation.photographer_profiles?.slug ?? null,
        meta:
          [
            conversation.photographer_profiles?.primary_specialty,
            conversation.photographer_profiles?.service_area,
          ]
            .filter((p): p is string => Boolean(p))
            .join(" · ") || null,
      }
    : {
        name: conversation.profiles?.full_name ?? "Client",
        avatarUrl: conversation.profiles?.avatar_url ?? null,
        slug: null,
        meta: null,
      };

  // Defense in depth: RLS already restricts the select above to
  // participants, so a non-participant would have hit notFound() already.

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .neq("sender_id", user.id)
    .is("read_at", null);

  return (
    <ConversationThread
      conversationId={id}
      currentUserId={user.id}
      otherName={other.name}
      otherAvatarUrl={other.avatarUrl}
      otherSlug={other.slug}
      otherMeta={other.meta}
      initialMessages={messages ?? []}
    />
  );
}
