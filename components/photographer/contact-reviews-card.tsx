import { Mail, Phone } from "lucide-react";
import { MessageButton } from "@/components/photographer/message-button";
import { ReviewsColumn, type ReviewWithReviewer } from "@/components/reviews/reviews-column";

function ContactRow({
  icon,
  href,
  text,
  last,
}: {
  icon: React.ReactNode;
  href: string;
  text: string;
  last?: boolean;
}) {
  return (
    <a
      href={href}
      className="flex items-center no-underline"
      style={{ gap: "8px", marginBottom: last ? 0 : "10px", color: "#4C4845", fontSize: "12px" }}
    >
      {icon}
      {text}
    </a>
  );
}

export function ContactReviewsCard({
  photographerId,
  photographerName,
  slug,
  isLoggedIn,
  email,
  phone,
  reviews,
  totalCount,
  avgRating,
  currentUserId,
  isOwnProfile,
  hasExistingReview,
}: {
  photographerId: string;
  photographerName: string;
  slug: string;
  isLoggedIn: boolean;
  email: string | null;
  phone: string | null;
  reviews: ReviewWithReviewer[];
  totalCount: number;
  avgRating: number;
  currentUserId: string | null;
  isOwnProfile: boolean;
  hasExistingReview: boolean;
}) {
  const hasReviews = totalCount > 0;
  const hasContact = Boolean(email || phone);

  return (
    <div
      className="rounded-[10px]"
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E6E2DD",
        padding: "20px",
        marginBottom: "24px",
      }}
    >
      <div
        className={hasReviews ? "grid grid-cols-1 sm:grid-cols-2" : "grid grid-cols-1"}
        style={{ gap: "24px" }}
      >
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
            Contact
          </div>

          <MessageButton
            photographerId={photographerId}
            slug={slug}
            isLoggedIn={isLoggedIn}
            className="mb-3 w-full"
          />

          {hasContact ? (
            <>
              {email && (
                <ContactRow
                  icon={<Mail size={14} color="#7A7572" />}
                  href={`mailto:${email}`}
                  text={email}
                  last={!phone}
                />
              )}
              {phone && (
                <ContactRow icon={<Phone size={14} color="#7A7572" />} href={`tel:${phone}`} text={phone} last />
              )}
            </>
          ) : (
            <p style={{ fontSize: "12px", color: "#B8B3AE", fontStyle: "italic" }}>
              No contact info provided.
            </p>
          )}
        </div>

        {hasReviews && (
          <ReviewsColumn
            photographerId={photographerId}
            photographerName={photographerName}
            initialReviews={reviews}
            totalCount={totalCount}
            avgRating={avgRating}
            currentUserId={currentUserId}
            isOwnProfile={isOwnProfile}
            hasExistingReview={hasExistingReview}
          />
        )}
      </div>
    </div>
  );
}
