"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

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
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={pending}
      aria-label={saved ? "Remove from saved" : "Save photographer"}
      aria-pressed={saved}
    >
      <Bookmark className={saved ? "fill-current" : undefined} />
    </Button>
  );
}
