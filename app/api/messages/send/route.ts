import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { newMessageEmail } from "@/lib/email/templates/new-message";

export async function POST(request: Request) {
  const { conversationId, content } = await request.json();

  const trimmed = typeof content === "string" ? content.trim() : "";
  if (!conversationId || !trimmed) {
    return NextResponse.json({ error: "Missing conversationId or content" }, { status: 400 });
  }
  if (trimmed.length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, client_id, photographer_id, photographer_profiles(user_id)")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed,
    })
    .select("*")
    .single();

  if (insertError || !message) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  // Best-effort notification — the message already succeeded regardless of
  // whether this email goes out.
  notifyRecipient({ conversation, senderId: user.id, content: trimmed, conversationId }).catch(
    (err) => console.error("[messages/send] failed to notify recipient:", err),
  );

  return NextResponse.json({ message });
}

async function notifyRecipient({
  conversation,
  senderId,
  content,
  conversationId,
}: {
  conversation: { client_id: string; photographer_profiles: { user_id: string } | null };
  senderId: string;
  content: string;
  conversationId: string;
}) {
  const recipientUserId =
    senderId === conversation.client_id
      ? conversation.photographer_profiles?.user_id
      : conversation.client_id;

  if (!recipientUserId) return;

  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: senderProfile }, { data: recipientUser }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", senderId).single(),
    admin.auth.admin.getUserById(recipientUserId),
  ]);

  const recipientEmail = recipientUser?.user?.email;
  if (!recipientEmail) return;

  const { subject, html } = newMessageEmail({
    senderName: senderProfile?.full_name ?? "Someone",
    messagePreview: content,
    conversationId,
  });

  await sendEmail({ to: recipientEmail, subject, html });
}
