"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/format-time";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function PendingPhotographerCard({
  photographerId,
  slug,
  name,
  specialty,
  location,
  bio,
  submittedAt,
}: {
  photographerId: string;
  slug: string;
  name: string;
  specialty: string;
  location: string | null;
  bio: string | null;
  submittedAt: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function handleApprove() {
    setPending(true);
    const res = await fetch("/api/admin/approve-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photographerId }),
    });
    setPending(false);
    if (!res.ok) {
      toast("Failed to approve. Try again.");
      return;
    }
    router.refresh();
  }

  async function handleReject() {
    setPending(true);
    const res = await fetch("/api/admin/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photographerId, reason: reason.trim() || undefined }),
    });
    setPending(false);
    if (!res.ok) {
      toast("Failed to reject. Try again.");
      return;
    }
    setRejectOpen(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">
              Submitted {formatRelativeTime(submittedAt)} ago
            </p>
          </div>
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">Specialty:</span> {specialty}
        </p>
        {location && (
          <p className="text-sm">
            <span className="text-muted-foreground">Location:</span> {location}
          </p>
        )}
        {bio && <p className="text-sm text-foreground/90">&ldquo;{bio}&rdquo;</p>}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" render={<Link href={`/photographer/${slug}`} target="_blank" />} nativeButton={false}>
            View Full Profile Preview
          </Button>
          <Button onClick={handleApprove} disabled={pending}>
            Approve
          </Button>
          <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={pending}>
            Reject
          </Button>
        </div>
      </CardContent>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {name}&apos;s profile</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={pending}>
              {pending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
