"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ReviewRow, type ReviewWithReviewer } from "./reviews-section";

const PAGE_SIZE = 5;

export function LoadMoreReviews({
  photographerId,
  offset,
}: {
  photographerId: string;
  offset: number;
}) {
  const [extraReviews, setExtraReviews] = useState<ReviewWithReviewer[]>([]);
  const [currentOffset, setCurrentOffset] = useState(offset);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, content, created_at, reviewer_id, profiles(full_name, avatar_url)")
      .eq("photographer_id", photographerId)
      .order("created_at", { ascending: false })
      .range(currentOffset, currentOffset + PAGE_SIZE - 1);

    const mapped: ReviewWithReviewer[] = (data ?? []).map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      created_at: r.created_at,
      reviewer_id: r.reviewer_id,
      reviewer_name: r.profiles?.full_name ?? "Anonymous",
      reviewer_avatar_url: r.profiles?.avatar_url ?? null,
    }));

    setExtraReviews((prev) => [...prev, ...mapped]);
    setCurrentOffset((prev) => prev + PAGE_SIZE);
    if (mapped.length < PAGE_SIZE) setDone(true);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col divide-y">
        {extraReviews.map((review) => (
          <ReviewRow key={review.id} review={review} />
        ))}
      </div>
      {!done && (
        <Button variant="outline" onClick={loadMore} disabled={loading}>
          {loading ? "Loading..." : "Load more"}
        </Button>
      )}
    </div>
  );
}
