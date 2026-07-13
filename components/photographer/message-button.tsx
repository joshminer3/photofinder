"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MessageButton({
  photographerId,
  slug,
  isLoggedIn,
}: {
  photographerId: string;
  slug: string;
  isLoggedIn: boolean;
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
    <Button
      size="lg"
      onClick={handleClick}
      disabled={loading}
      className="w-full sm:w-auto"
    >
      <MessageCircle className="size-4" />
      {loading ? "Starting..." : "Send a Message"}
    </Button>
  );
}
