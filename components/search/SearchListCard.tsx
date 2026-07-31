"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SWIPE_THRESHOLD_PX = 40;

export type SearchListCardData = {
  photographerId: string;
  slug: string;
  fullName: string;
  bio: string | null;
  primarySpecialty: string;
  secondarySpecialty: string | null;
  serviceArea: string | null;
  priceRangeMin: number | null;
  availableThisMonth: boolean;
  images: string[];
  avgRating: number | null;
  reviewCount: number;
};

export function SearchListCard({
  photographer,
  isLoggedIn,
}: {
  photographer: SearchListCardData;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [messagePending, setMessagePending] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const profileHref = `/photographer/${photographer.slug}`;
  const hasMultipleImages = photographer.images.length > 1;
  const touchStartX = useRef<number | null>(null);
  const didSwipeRef = useRef(false);

  function handlePrevImage(e: React.MouseEvent) {
    e.stopPropagation();
    setImageIndex((i) => Math.max(0, i - 1));
  }

  function handleNextImage(e: React.MouseEvent) {
    e.stopPropagation();
    setImageIndex((i) => Math.min(photographer.images.length - 1, i + 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    // Swiped far enough — treat this as a carousel gesture, not a tap, so
    // the card's onClick (navigate to profile) that follows should no-op.
    didSwipeRef.current = true;
    if (deltaX < 0) {
      setImageIndex((i) => Math.min(photographer.images.length - 1, i + 1));
    } else {
      setImageIndex((i) => Math.max(0, i - 1));
    }
  }

  function handleCardClick() {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    router.push(profileHref);
  }

  async function handleMessage(e: React.MouseEvent) {
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent("/search")}`);
      return;
    }

    setMessagePending(true);
    try {
      const res = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId: photographer.photographerId }),
      });
      if (!res.ok) {
        toast("Couldn't start a conversation. Try again.");
        setMessagePending(false);
        return;
      }
      const { conversationId } = await res.json();
      router.push(`/messages/${conversationId}`);
    } catch {
      toast("Couldn't start a conversation. Try again.");
      setMessagePending(false);
    }
  }

  function handleViewProfile(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(profileHref);
  }

  const bioTwoLineClamp: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative flex cursor-pointer flex-col overflow-hidden rounded-[10px] border transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:flex-row"
      style={{ borderColor: "#E6E2DD", background: "#FFFFFF" }}
    >
      {photographer.priceRangeMin && (
        <span
          className="absolute rounded-full"
          style={{
            top: "10px",
            right: "10px",
            zIndex: 1,
            background: "#FDFCFB",
            border: "0.5px solid #E6E2DD",
            color: "#111010",
            fontSize: "12px",
            fontWeight: 700,
            padding: "4px 10px",
          }}
        >
          From ${photographer.priceRangeMin}
        </span>
      )}
      <div className="flex w-full shrink-0 flex-col sm:w-[180px]">
        <div
          className="relative h-[180px] w-full sm:h-auto sm:flex-1"
          style={{ minHeight: "160px", background: "#E6E2DD", touchAction: "pan-y" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {photographer.images.map((url, i) => (
            <Image
              key={url}
              src={url}
              alt=""
              fill
              sizes="180px"
              loading={i === imageIndex ? "eager" : "lazy"}
              className="object-cover"
              style={{ opacity: i === imageIndex ? 1 : 0 }}
            />
          ))}

          {hasMultipleImages && imageIndex > 0 && (
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous image"
              className="absolute flex items-center justify-center rounded-full backdrop-blur-[4px]"
              style={{
                top: "50%",
                left: "6px",
                transform: "translateY(-50%)",
                width: "28px",
                height: "28px",
                background: "rgba(255,255,255,0.85)",
              }}
            >
              <ChevronLeft size={16} color="#111010" />
            </button>
          )}
          {hasMultipleImages && imageIndex < photographer.images.length - 1 && (
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next image"
              className="absolute flex items-center justify-center rounded-full backdrop-blur-[4px]"
              style={{
                top: "50%",
                right: "6px",
                transform: "translateY(-50%)",
                width: "28px",
                height: "28px",
                background: "rgba(255,255,255,0.85)",
              }}
            >
              <ChevronRight size={16} color="#111010" />
            </button>
          )}

          {photographer.availableThisMonth && (
            <span
              className="absolute bottom-[10px] left-[10px] rounded-full backdrop-blur-[4px]"
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "#111010",
                fontSize: "10px",
                fontWeight: 500,
                padding: "3px 8px",
              }}
            >
              Available this month
            </span>
          )}
        </div>

        {hasMultipleImages && (
          <div className="flex items-center justify-center" style={{ gap: "4px", padding: "6px 0" }}>
            {photographer.images.map((url, i) => (
              <span
                key={url}
                className="rounded-full"
                style={{
                  width: "5px",
                  height: "5px",
                  background: i === imageIndex ? "#111010" : "#E6E2DD",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between" style={{ padding: "14px 16px" }}>
        <div>
          <div
            className="flex items-baseline gap-2 sm:pr-16"
            style={{ marginBottom: "2px" }}
          >
            <span
              className="truncate"
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#111010",
                letterSpacing: "-0.3px",
              }}
            >
              {photographer.fullName}
            </span>
          </div>

          <p style={{ fontSize: "11px", color: "#7A7572", marginBottom: "8px" }}>
            {photographer.serviceArea ?? ""}
            {photographer.reviewCount > 0 && photographer.avgRating !== null && (
              <>
                {photographer.serviceArea ? " · " : ""}
                <span style={{ color: "#B8762E" }}>★★★★★</span>{" "}
                {photographer.avgRating.toFixed(1)} ({photographer.reviewCount})
              </>
            )}
          </p>

          {photographer.bio && (
            <p
              style={{
                fontSize: "12px",
                color: "#4C4845",
                lineHeight: 1.55,
                marginBottom: "10px",
                ...bioTwoLineClamp,
              }}
            >
              {photographer.bio}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            <SpecialtyTag label={photographer.primarySpecialty} />
            {photographer.secondarySpecialty && (
              <SpecialtyTag label={photographer.secondarySpecialty} />
            )}
          </div>

          <div
            className="flex flex-col gap-1.5 sm:shrink-0 sm:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleViewProfile}
              className="order-1 w-full rounded-[6px] border-none sm:order-2 sm:w-auto"
              style={{
                height: "30px",
                background: "#111010",
                color: "#FDFCFB",
                fontSize: "11px",
                fontWeight: 500,
                padding: "0 12px",
              }}
            >
              View Profile
            </button>
            <button
              type="button"
              onClick={handleMessage}
              disabled={messagePending}
              className="order-2 w-full rounded-[6px] border bg-transparent sm:order-1 sm:w-auto"
              style={{
                height: "30px",
                borderColor: "#E6E2DD",
                color: "#111010",
                fontSize: "11px",
                padding: "0 12px",
              }}
            >
              Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecialtyTag({ label }: { label: string }) {
  return (
    <span
      className="shrink-0 rounded-full"
      style={{
        background: "#E6E2DD",
        color: "#302D2B",
        fontSize: "10px",
        fontWeight: 500,
        padding: "2px 9px",
      }}
    >
      {label}
    </span>
  );
}
