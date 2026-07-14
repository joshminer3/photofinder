import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./star-rating";
import { ReviewModal } from "./review-modal";
import { LoadMoreReviews } from "./load-more-reviews";

export type ReviewWithReviewer = {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
};

export function ReviewsSection({
  photographerId,
  photographerName,
  reviews,
  totalCount,
  avgRating,
  currentUserId,
  isOwnProfile,
}: {
  photographerId: string;
  photographerName: string;
  reviews: ReviewWithReviewer[];
  totalCount: number;
  avgRating: number;
  currentUserId: string | null;
  isOwnProfile: boolean;
}) {
  // A logged-in client who isn't the photographer can always leave the
  // first review — only the aggregate/list display hides when empty, per
  // "never show an empty reviews tab."
  const canReview = Boolean(currentUserId) && !isOwnProfile;
  if (totalCount === 0 && !canReview) return null;

  const existingReview = currentUserId
    ? reviews.find((r) => r.reviewer_id === currentUserId)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Reviews</h2>

      {totalCount > 0 && (
        <div className="flex items-center gap-2">
          <StarRating rating={avgRating} size="size-5" />
          <span className="font-medium">{avgRating.toFixed(1)}</span>
          <span className="text-muted-foreground">
            ({totalCount} review{totalCount === 1 ? "" : "s"})
          </span>
        </div>
      )}

      {canReview && (
        <div>
          <ReviewModal
            photographerId={photographerId}
            photographerName={photographerName}
            existingReview={existingReview ?? null}
          />
        </div>
      )}

      {reviews.length > 0 && (
        <div className="flex flex-col divide-y">
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </div>
      )}

      {totalCount > reviews.length && (
        <LoadMoreReviews photographerId={photographerId} offset={reviews.length} />
      )}
    </div>
  );
}

export function ReviewRow({ review }: { review: ReviewWithReviewer }) {
  return (
    <div className="flex flex-col gap-2 py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={review.reviewer_avatar_url ?? undefined} />
            <AvatarFallback>
              {review.reviewer_name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{review.reviewer_name}</span>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <span className="text-xs text-muted-foreground">
        {new Date(review.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
      <p className="text-sm text-foreground/90">{review.content}</p>
    </div>
  );
}
