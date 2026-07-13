"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/format-time";
import type { Message } from "@/lib/types/database";

const MAX_LENGTH = 2000;
const WARN_THRESHOLD = 1500;

type LocalMessage = Message & { status?: "sending" | "failed" };

export function ConversationThread({
  conversationId,
  currentUserId,
  otherName,
  otherAvatarUrl,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherName: string;
  otherAvatarUrl: string | null;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // The Realtime socket authenticates separately from the main client —
    // without an explicit setAuth using the current session's JWT, it
    // connects as `anon` and RLS silently drops every broadcast.
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`conversation:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const incoming = payload.new as Message;
            // Own messages are handled optimistically by handleSend; skip
            // the realtime echo of our own insert so it doesn't render twice.
            if (incoming.sender_id === currentUserId) return;
            setMessages((prev) =>
              prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
            );
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  async function handleSend(retryMessage?: LocalMessage) {
    const content = retryMessage ? retryMessage.content : draft.trim();
    if (!content || sending) return;

    const tempId = retryMessage?.id ?? crypto.randomUUID();
    const optimisticMessage: LocalMessage = retryMessage
      ? { ...retryMessage, status: "sending" }
      : {
          id: tempId,
          conversation_id: conversationId,
          sender_id: currentUserId,
          content,
          read_at: null,
          created_at: new Date().toISOString(),
          status: "sending",
        };

    setMessages((prev) =>
      retryMessage
        ? prev.map((m) => (m.id === tempId ? optimisticMessage : m))
        : [...prev, optimisticMessage],
    );
    if (!retryMessage) setDraft("");
    setSending(true);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content }),
      });

      if (!res.ok) throw new Error("Failed to send");

      const { message } = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...message, status: undefined } : m)),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)),
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center gap-3 border-b p-4">
        <Avatar className="size-9">
          <AvatarImage src={otherAvatarUrl ?? undefined} />
          <AvatarFallback>{otherName.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="font-semibold">{otherName}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isOwn={m.sender_id === currentUserId}
              onRetry={() => handleSend(m)}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t p-4">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!draft.trim() || sending}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
        {draft.length > WARN_THRESHOLD && (
          <span className="self-end text-xs text-muted-foreground">
            {draft.length}/{MAX_LENGTH}
          </span>
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  onRetry,
}: {
  message: LocalMessage;
  isOwn: boolean;
  onRetry: () => void;
}) {
  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        } ${message.status === "failed" ? "opacity-60" : ""}`}
      >
        {message.content}
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {message.status === "sending" && <span>Sending...</span>}
        {message.status === "failed" ? (
          <>
            <span className="text-destructive">Message failed to send.</span>
            <button type="button" onClick={onRetry} className="underline">
              Try again
            </button>
          </>
        ) : (
          message.status !== "sending" && (
            <span>{formatRelativeTime(message.created_at)}</span>
          )
        )}
      </div>
    </div>
  );
}
