"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SuspendUserButton({
  userId,
  isSuspended,
}: {
  userId: string;
  isSuspended: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSuspend() {
    if (!confirm("Suspend this account?")) return;
    setPending(true);
    const res = await fetch("/api/admin/suspend-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setPending(false);
    if (!res.ok) {
      toast("Failed to suspend. Try again.");
      return;
    }
    router.refresh();
  }

  if (isSuspended) {
    return <span className="text-xs text-muted-foreground">Suspended</span>;
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleSuspend} disabled={pending}>
      Suspend account
    </Button>
  );
}
