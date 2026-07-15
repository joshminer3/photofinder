"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const REASONS = [
  "Fake or spam profile",
  "Inappropriate content",
  "Stolen photos",
  "Other",
];

export function ReportModal({
  photographerId,
  photographerName,
}: {
  photographerId: string;
  photographerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId, reason, details: details.trim() || null }),
      });

      if (!res.ok) {
        toast("Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      toast("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        setReason("");
        setDetails("");
        setSubmitted(false);
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ fontSize: "12px", color: "#B8B3AE" }}
        className="hover:text-foreground"
      >
        Report this profile
      </button>
      <DialogContent>
        {submitted ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <DialogTitle>Report submitted</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Thanks for letting us know. We&apos;ll take a look.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report {photographerName}&apos;s profile</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Why are you reporting this?</Label>
                <RadioGroup value={reason} onValueChange={setReason}>
                  {REASONS.map((r) => (
                    <div key={r} className="flex items-center gap-2">
                      <RadioGroupItem value={r} id={`reason-${r}`} />
                      <Label htmlFor={`reason-${r}`} className="font-normal">
                        {r}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="details">Optional: add details</Label>
                <Textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!reason || submitting}>
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
