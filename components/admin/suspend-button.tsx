"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SuspendButton({ photographerId }: { photographerId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSuspend() {
    if (!confirm("Suspend this photographer? Their profile will be hidden from search.")) {
      return;
    }
    setPending(true);
    const res = await fetch("/api/admin/suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photographerId }),
    });
    setPending(false);
    if (!res.ok) {
      toast("Failed to suspend. Try again.");
      return;
    }
    router.refresh();
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleSuspend} disabled={pending}>
      Suspend
    </Button>
  );
}
