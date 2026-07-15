"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function MessageButton({
  photographerId,
  slug,
  isLoggedIn,
  className,
}: {
  photographerId: string;
  slug: string;
  isLoggedIn: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/photographer/${slug}`)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId }),
      });

      if (!res.ok) {
        toast("Couldn't start a conversation. Try again.");
        setLoading(false);
        return;
      }

      const { conversationId } = await res.json();
      router.push(`/messages/${conversationId}`);
    } catch {
      toast("Couldn't start a conversation. Try again.");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn("flex items-center justify-center gap-1.5 rounded-[6px] border-none", className)}
      style={{
        height: "36px",
        background: "#111010",
        color: "#FDFCFB",
        fontSize: "13px",
        fontWeight: 500,
        padding: "0 16px",
      }}
    >
      <MessageCircle size={15} />
      {loading ? "Starting..." : "Send a message"}
    </button>
  );
}
