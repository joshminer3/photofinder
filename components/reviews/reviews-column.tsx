"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ReviewModal } from "./review-modal";

export type ReviewWithReviewer = {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
};

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= Math.round(rating) ? "#B8762E" : "#E6E2DD" }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ReviewsColumn({
  photographerId,
  photographerName,
  initialReviews,
  totalCount,
  avgRating,
  currentUserId,
  isOwnProfile,
  hasExistingReview,
}: {
  photographerId: string;
  photographerName: string;
  initialReviews: ReviewWithReviewer[];
  totalCount: number;
  avgRating: number;
  currentUserId: string | null;
  isOwnProfile: boolean;
  hasExistingReview: boolean;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(false);

  async function handleSeeAll() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, content, created_at, reviewer_id, profiles(full_name, avatar_url)")
      .eq("photographer_id", photographerId)
      .order("created_at", { ascending: false })
      .range(reviews.length, totalCount - 1);

    const mapped: ReviewWithReviewer[] = (data ?? []).map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      created_at: r.created_at,
      reviewer_id: r.reviewer_id,
      reviewer_name: r.profiles?.full_name ?? "Anonymous",
      reviewer_avatar_url: r.profiles?.avatar_url ?? null,
    }));

    setReviews((prev) => [...prev, ...mapped]);
    setLoading(false);
  }

  const canReview = Boolean(currentUserId) && !isOwnProfile && !hasExistingReview;

  return (
    <div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#7A7572",
          marginBottom: "12px",
        }}
      >
        Reviews
      </div>

      <div className="flex items-center" style={{ gap: "6px", marginBottom: "10px" }}>
        <Stars rating={avgRating} />
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#111010" }}>
          {avgRating.toFixed(1)}
        </span>
        <span style={{ fontSize: "12px", color: "#7A7572" }}>
          ({totalCount} review{totalCount === 1 ? "" : "s"})
        </span>
        {canReview && (
          <div style={{ marginLeft: "auto" }}>
            <ReviewModal
              photographerId={photographerId}
              photographerName={photographerName}
              existingReview={null}
            />
          </div>
        )}
      </div>

      <div>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{ borderTop: "0.5px solid #EEEAE4", paddingTop: "10px", marginTop: "10px" }}
          >
            <div className="flex items-start" style={{ gap: "8px" }}>
              <div
                className="flex shrink-0 items-center justify-center rounded-full"
                style={{
                  width: "22px",
                  height: "22px",
                  background: "#E6E2DD",
                  color: "#7A7572",
                  fontSize: "9px",
                  fontWeight: 500,
                }}
              >
                {review.reviewer_name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#111010" }}>
                    {review.reviewer_name}
                  </span>
                  <span className="flex shrink-0 items-center" style={{ gap: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#7A7572" }}>
                      {new Date(review.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <Stars rating={review.rating} size={10} />
                  </span>
                </div>
                <p style={{ fontSize: "11px", color: "#4C4845", lineHeight: 1.5, marginTop: "2px" }}>
                  {review.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalCount > reviews.length && (
        <button
          type="button"
          onClick={handleSeeAll}
          disabled={loading}
          style={{ display: "block", marginTop: "10px", fontSize: "12px", color: "#7A7572" }}
        >
          {loading ? "Loading..." : `See all ${totalCount} reviews →`}
        </button>
      )}
    </div>
  );
}
