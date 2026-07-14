"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function resolve(action: "dismiss" | "suspend") {
    if (action === "suspend" && !confirm("Suspend this photographer?")) return;
    setPending(true);
    const res = await fetch("/api/admin/reports/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action }),
    });
    setPending(false);
    if (!res.ok) {
      toast("Failed to update report. Try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => resolve("dismiss")} disabled={pending}>
        Dismiss
      </Button>
      <Button variant="destructive" size="sm" onClick={() => resolve("suspend")} disabled={pending}>
        Suspend Photographer
      </Button>
    </div>
  );
}
