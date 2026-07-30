"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ExternalLink, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSmartBack } from "@/lib/hooks/use-smart-back";
import type { Message } from "@/lib/types/database";

const MAX_LENGTH = 2000;
const WARN_THRESHOLD = 1500;
const DANGER_THRESHOLD = 1900;
const TEXTAREA_MIN_HEIGHT = 42;
const TEXTAREA_MAX_HEIGHT = 120;
const NEAR_BOTTOM_PX = 100;

type LocalMessage = Message & { status?: "sending" | "failed" };

function Avatar({ name, avatarUrl, size }: { name: string; avatarUrl: string | null; size: number }) {
  return (
    <div className="relative shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size, background: "#E6E2DD" }}>
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <div
          className="flex size-full items-center justify-center"
          style={{ color: "#7A7572", fontSize: size * 0.4, fontWeight: 500 }}
        >
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDateSeparator(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ConversationThread({
  conversationId,
  currentUserId,
  otherName,
  otherAvatarUrl,
  otherSlug,
  otherMeta,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherName: string;
  otherAvatarUrl: string | null;
  otherSlug: string | null;
  otherMeta: string | null;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const goBack = useSmartBack("/messages");
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (isNearBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
  }, [draft]);

  function handleScroll() {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < NEAR_BOTTOM_PX;
  }

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

    isNearBottomRef.current = true;
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (draft.trim()) handleSend();
    }
  }

  const charCount = draft.length;
  const showCharCount = charCount > WARN_THRESHOLD;

  return (
    <div className="flex h-full flex-1 flex-col">
      <div
        className="flex shrink-0 items-center"
        style={{ height: "54px", borderBottom: "0.5px solid #DAD4CC", padding: "0 18px", gap: "12px", background: "#FFFFFF" }}
      >
        <button
          type="button"
          onClick={goBack}
          className="flex shrink-0 items-center"
          style={{ gap: "4px", fontSize: "12px", color: "#7A7572" }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div style={{ width: "0.5px", height: "16px", background: "#DAD4CC" }} />

        {otherSlug ? (
          <button
            type="button"
            onClick={() => router.push(`/photographer/${otherSlug}`)}
            className="flex min-w-0 flex-1 items-center text-left transition-opacity hover:opacity-70"
            style={{ gap: "10px" }}
          >
            <Avatar name={otherName} avatarUrl={otherAvatarUrl} size={36} />
            <div className="min-w-0 flex-1">
              <p
                className="truncate"
                style={{ fontSize: "14px", fontWeight: 500, color: "#111010", letterSpacing: "-0.3px" }}
              >
                {otherName}
              </p>
              {otherMeta && (
                <p className="truncate" style={{ fontSize: "11px", color: "#7A7572" }}>
                  {otherMeta}
                </p>
              )}
            </div>
          </button>
        ) : (
          <>
            <Avatar name={otherName} avatarUrl={otherAvatarUrl} size={36} />
            <div className="min-w-0 flex-1">
              <p
                className="truncate"
                style={{ fontSize: "14px", fontWeight: 500, color: "#111010", letterSpacing: "-0.3px" }}
              >
                {otherName}
              </p>
              {otherMeta && (
                <p className="truncate" style={{ fontSize: "11px", color: "#7A7572" }}>
                  {otherMeta}
                </p>
              )}
            </div>
          </>
        )}

        {otherSlug && (
          <button
            type="button"
            onClick={() => router.push(`/photographer/${otherSlug}`)}
            className="flex shrink-0 items-center rounded-[6px] border"
            style={{
              gap: "4px",
              fontSize: "12px",
              color: "#4C4845",
              borderColor: "#E6E2DD",
              padding: "5px 10px",
              background: "#FDFCFB",
            }}
          >
            <ExternalLink size={13} />
            View profile
          </button>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex flex-col"
        style={{ flex: 1, overflowY: "auto", padding: "20px 24px 12px", gap: "12px", background: "#FDFCFB" }}
      >
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const isOwn = m.sender_id === currentUserId;
          const showDateSeparator =
            !prev || new Date(m.created_at).toDateString() !== new Date(prev.created_at).toDateString();
          const isGrouped = Boolean(prev) && prev.sender_id === m.sender_id && !showDateSeparator;

          return (
            <div key={m.id} className="flex flex-col" style={{ gap: "12px" }}>
              {showDateSeparator && (
                <div className="flex items-center justify-center" style={{ margin: "8px 0" }}>
                  <span style={{ fontSize: "10px", color: "#B8B3AE", padding: "0 8px", background: "#FDFCFB" }}>
                    {formatDateSeparator(m.created_at)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={m}
                isOwn={isOwn}
                isGrouped={isGrouped}
                otherName={otherName}
                otherAvatarUrl={otherAvatarUrl}
                onRetry={() => handleSend(m)}
              />
            </div>
          );
        })}
      </div>

      <div style={{ flexShrink: 0, padding: "12px 16px 14px", borderTop: "0.5px solid #DAD4CC", background: "#FFFFFF" }}>
        <div className="flex items-end" style={{ gap: "8px" }}>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            rows={1}
            className="flex-1 outline-none transition-colors focus:border-[#B8B3AE]"
            style={{
              background: "#FDFCFB",
              border: "0.5px solid #E6E2DD",
              borderRadius: "10px",
              padding: "10px 14px",
              fontSize: "13px",
              color: "#111010",
              minHeight: `${TEXTAREA_MIN_HEIGHT}px`,
              maxHeight: `${TEXTAREA_MAX_HEIGHT}px`,
              resize: "none",
            }}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!draft.trim() || sending}
            aria-label="Send message"
            className="flex shrink-0 items-center justify-center rounded-[8px] border-none disabled:cursor-not-allowed"
            style={{
              width: "38px",
              height: "38px",
              background: draft.trim() ? "#111010" : "#E6E2DD",
            }}
          >
            <Send size={16} color="#FDFCFB" />
          </button>
        </div>

        {showCharCount ? (
          <div
            style={{
              marginTop: "8px",
              fontSize: "10px",
              textAlign: "right",
              color: charCount > DANGER_THRESHOLD ? "#E24B4A" : "#7A7572",
            }}
          >
            {charCount} / {MAX_LENGTH}
          </div>
        ) : (
          <p style={{ marginTop: "8px", fontSize: "10px", color: "#B8B3AE", textAlign: "center" }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  isGrouped,
  otherName,
  otherAvatarUrl,
  onRetry,
}: {
  message: LocalMessage;
  isOwn: boolean;
  isGrouped: boolean;
  otherName: string;
  otherAvatarUrl: string | null;
  onRetry: () => void;
}) {
  const isFailed = message.status === "failed";
  const isSending = message.status === "sending";

  if (isOwn) {
    return (
      <div className="flex flex-col items-end" style={{ gap: "3px" }}>
        <div
          style={{
            maxWidth: "65%",
            background: "#111010",
            color: "#FDFCFB",
            fontSize: "13px",
            lineHeight: 1.55,
            padding: "10px 14px",
            borderRadius: isGrouped ? "16px" : "16px 4px 16px 16px",
            opacity: isFailed ? 0.5 : 1,
          }}
        >
          {message.content}
        </div>
        {isFailed ? (
          <button
            type="button"
            onClick={onRetry}
            style={{ fontSize: "10px", color: "#E24B4A", paddingRight: "4px" }}
          >
            Failed to send · Retry
          </button>
        ) : (
          <span style={{ fontSize: "10px", color: "#B8B3AE", paddingRight: "4px" }}>
            {isSending ? "Sending..." : formatBubbleTime(message.created_at)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-end" style={{ gap: "8px" }}>
      {isGrouped ? (
        <div style={{ width: "28px", flexShrink: 0 }} />
      ) : (
        <Avatar name={otherName} avatarUrl={otherAvatarUrl} size={28} />
      )}
      <div className="flex flex-col" style={{ gap: "3px" }}>
        <div
          style={{
            maxWidth: "65%",
            background: "#FFFFFF",
            border: "0.5px solid #E6E2DD",
            color: "#111010",
            fontSize: "13px",
            lineHeight: 1.55,
            padding: "10px 14px",
            borderRadius: isGrouped ? "16px" : "4px 16px 16px 16px",
          }}
        >
          {message.content}
        </div>
        <span style={{ fontSize: "10px", color: "#B8B3AE" }}>
          {formatBubbleTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
