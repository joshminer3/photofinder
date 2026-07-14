"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StarRatingInput } from "./star-rating";

const MIN_LENGTH = 20;
const MAX_LENGTH = 1000;

export function ReviewModal({
  photographerId,
  photographerName,
  existingReview,
}: {
  photographerId: string;
  photographerName: string;
  existingReview: { rating: number; content: string } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [content, setContent] = useState(existingReview?.content ?? "");
  const [submitting, setSubmitting] = useState(false);

  const isValid = rating >= 1 && rating <= 5 && content.trim().length >= MIN_LENGTH;

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId, rating, content: content.trim() }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }));
        toast(error ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      toast("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} variant="outline">
        {existingReview ? "Edit your review" : "Leave a Review"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate your experience with {photographerName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <StarRatingInput value={rating} onChange={setRating} />

          <div className="flex flex-col gap-1.5">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
              rows={5}
              placeholder="Share details of your experience..."
            />
            <span className="self-end text-xs text-muted-foreground">
              {content.length}/{MAX_LENGTH}
              {content.trim().length < MIN_LENGTH &&
                ` (min ${MIN_LENGTH})`}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
