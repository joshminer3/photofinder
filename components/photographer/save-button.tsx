"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SaveButton({
  photographerId,
  slug,
  isLoggedIn,
  initialSaved,
}: {
  photographerId: string;
  slug: string;
  isLoggedIn: boolean;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/photographer/${slug}`)}`);
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    setPending(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaved(!nextSaved);
      setPending(false);
      router.push(`/login?redirect=${encodeURIComponent(`/photographer/${slug}`)}`);
      return;
    }

    const { error } = nextSaved
      ? await supabase
          .from("saved_photographers")
          .insert({ user_id: user.id, photographer_id: photographerId })
      : await supabase
          .from("saved_photographers")
          .delete()
          .eq("user_id", user.id)
          .eq("photographer_id", photographerId);

    setPending(false);

    if (error) {
      setSaved(!nextSaved);
      toast("Couldn't update saved photographers. Try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={saved ? "Remove from saved" : "Save photographer"}
      aria-pressed={saved}
      className="absolute flex items-center justify-center rounded-[8px] border-none"
      style={{
        top: "12px",
        right: "12px",
        width: "32px",
        height: "32px",
        background: "rgba(255,255,255,0.92)",
        zIndex: 2,
      }}
    >
      <Bookmark size={16} color="#111010" className={saved ? "fill-current" : undefined} />
    </button>
  );
}
