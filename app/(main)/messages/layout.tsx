import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConversationSummaries } from "@/lib/messages/get-conversations";
import { MessagesShell } from "@/components/messages/messages-shell";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/messages");
  }

  const { data: photographerProfile } = await supabase
    .from("photographer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const conversations = await getConversationSummaries(
    user.id,
    photographerProfile?.id ?? null,
  );

  return <MessagesShell conversations={conversations}>{children}</MessagesShell>;
}
