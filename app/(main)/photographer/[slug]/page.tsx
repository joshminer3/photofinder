import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AtSign, Globe, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/photographer/back-button";
import { SaveButton } from "@/components/photographer/save-button";
import { MessageButton } from "@/components/photographer/message-button";
import { ContactReviewsCard } from "@/components/photographer/contact-reviews-card";
import {
  PortfolioGrid,
  type PortfolioMedia,
} from "@/components/photographer/portfolio-grid";
import type { ReviewWithReviewer } from "@/components/reviews/reviews-column";
import { ReportModal } from "@/components/reports/report-modal";

const REVIEWS_PAGE_SIZE = 2;

async function getPhotographer(slug: string) {
  const supabase = await createClient();

  const { data: photographer } = await supabase
    .from("photographer_profiles")
    .select("*, profiles(full_name, avatar_url, is_approved)")
    .eq("slug", slug)
    .single();

  if (!photographer) return null;

  const { data: portfolioItems } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("photographer_id", photographer.id)
    .order("display_order");

  const media: PortfolioMedia[] = (portfolioItems ?? []).map((item) => ({
    id: item.id,
    type: item.type as "photo" | "video",
    url: supabase.storage.from("portfolios").getPublicUrl(item.storage_path)
      .data.publicUrl,
  }));

  return { photographer, media };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPhotographer(slug);
  if (!result) return {};

  const { photographer, media } = result;
  const name = photographer.profiles?.full_name ?? "Photographer";
  const description = photographer.bio
    ? photographer.bio.slice(0, 160)
    : `${name} — ${photographer.primary_specialty} photographer in ${photographer.service_area ?? "Utah"}.`;
  const ogImage = media.find((m) => m.type === "photo")?.url;

  return {
    title: `${name} — ${photographer.primary_specialty} Photographer in ${photographer.service_area ?? "Utah"} | Foto`,
    description,
    openGraph: ogImage ? { images: [ogImage] } : undefined,
  };
}

export default async function PhotographerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPhotographer(slug);
  if (!result) notFound();

  const { photographer, media } = result;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialSaved = false;
  if (user) {
    const { data: savedRow } = await supabase
      .from("saved_photographers")
      .select("id")
      .eq("user_id", user.id)
      .eq("photographer_id", photographer.id)
      .maybeSingle();
    initialSaved = Boolean(savedRow);
  }

  const [{ data: allRatings }, { data: firstReviews }] = await Promise.all([
    supabase.from("reviews").select("rating, reviewer_id").eq("photographer_id", photographer.id),
    supabase
      .from("reviews")
      .select("id, rating, content, created_at, reviewer_id, profiles(full_name, avatar_url)")
      .eq("photographer_id", photographer.id)
      .order("created_at", { ascending: false })
      .range(0, REVIEWS_PAGE_SIZE - 1),
  ]);

  const reviewCount = allRatings?.length ?? 0;
  const avgRating =
    reviewCount > 0
      ? (allRatings ?? []).reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
  const hasExistingReview = user
    ? (allRatings ?? []).some((r) => r.reviewer_id === user.id)
    : false;

  const reviews: ReviewWithReviewer[] = (firstReviews ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    content: r.content,
    created_at: r.created_at,
    reviewer_id: r.reviewer_id,
    reviewer_name: r.profiles?.full_name ?? "Anonymous",
    reviewer_avatar_url: r.profiles?.avatar_url ?? null,
  }));

  const profile = photographer.profiles;
  const name = profile?.full_name ?? "Photographer";
  const coverPhoto = media.find((m) => m.type === "photo");
  const specialties = [
    photographer.primary_specialty,
    photographer.secondary_specialty_1,
    photographer.secondary_specialty_2,
  ].filter((s): s is string => Boolean(s));

  const priceLabel = photographer.price_range_min
    ? `From $${photographer.price_range_min}`
    : null;

  const hasSocialLinks = Boolean(
    photographer.instagram_url || photographer.website_url || photographer.other_link_url,
  );

  return (
    <div style={{ background: "#FDFCFB" }} className="min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-[760px]" style={{ padding: "28px 24px 48px" }}>
        <BackButton />

        {/* Hero */}
        <div
          className="relative h-[180px] w-full sm:h-[220px]"
          style={{ borderRadius: "12px", overflow: "hidden", background: "#E6E2DD" }}
        >
          {coverPhoto && (
            <Image
              src={coverPhoto.url}
              alt=""
              fill
              priority
              sizes="760px"
              className="object-cover"
            />
          )}
          <SaveButton
            photographerId={photographer.id}
            slug={slug}
            isLoggedIn={Boolean(user)}
            initialSaved={initialSaved}
          />
        </div>

        {/* Avatar + name row + message button */}
        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          style={{ marginBottom: "12px" }}
        >
          <div className="flex items-end gap-4">
            <div
              className="relative z-[1] mt-[-36px] size-[72px] shrink-0 overflow-hidden rounded-full sm:mt-[-42px] sm:size-[84px]"
              style={{ border: "3px solid #FDFCFB", background: "#E6E2DD" }}
            >
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" />
              ) : (
                <div
                  className="flex size-full items-center justify-center"
                  style={{ color: "#7A7572", fontSize: "24px", fontWeight: 500 }}
                >
                  {name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1" style={{ paddingBottom: "4px" }}>
              <div
                className="flex flex-wrap items-center"
                style={{ gap: "10px", marginBottom: "5px" }}
              >
                <h1
                  style={{
                    fontSize: "20px",
                    fontWeight: 500,
                    color: "#111010",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {name}
                </h1>
                {photographer.service_area && (
                  <span style={{ fontSize: "12px", color: "#7A7572" }}>
                    {photographer.service_area}
                  </span>
                )}
                {photographer.available_this_month && (
                  <span style={{ fontSize: "12px", color: "#4C4845", fontWeight: 500 }}>
                    ✓ Available
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center" style={{ gap: "6px" }}>
                {specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-full"
                    style={{
                      background: "#E6E2DD",
                      color: "#302D2B",
                      fontSize: "11px",
                      fontWeight: 500,
                      padding: "3px 10px",
                    }}
                  >
                    {s}
                  </span>
                ))}
                {priceLabel && (
                  <span style={{ fontSize: "12px", color: "#7A7572" }}>{priceLabel}</span>
                )}
              </div>
            </div>
          </div>

          <MessageButton
            photographerId={photographer.id}
            slug={slug}
            isLoggedIn={Boolean(user)}
            className="w-full sm:w-auto"
          />
        </div>

        {photographer.bio && (
          <p style={{ fontSize: "13px", color: "#4C4845", lineHeight: 1.65, marginBottom: "10px" }}>
            {photographer.bio}
          </p>
        )}

        {hasSocialLinks && (
          <div className="flex flex-wrap" style={{ gap: "6px" }}>
            {photographer.instagram_url && (
              <a
                href={photographer.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center rounded-[6px] border bg-white"
                style={{
                  height: "28px",
                  borderColor: "#E6E2DD",
                  color: "#4C4845",
                  fontSize: "11px",
                  padding: "0 10px",
                  gap: "5px",
                }}
              >
                <AtSign size={13} />
                Instagram
              </a>
            )}
            {photographer.website_url && (
              <a
                href={photographer.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center rounded-[6px] border bg-white"
                style={{
                  height: "28px",
                  borderColor: "#E6E2DD",
                  color: "#4C4845",
                  fontSize: "11px",
                  padding: "0 10px",
                  gap: "5px",
                }}
              >
                <Globe size={13} />
                Website
              </a>
            )}
            {photographer.other_link_url && (
              <a
                href={photographer.other_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center rounded-[6px] border bg-white"
                style={{
                  height: "28px",
                  borderColor: "#E6E2DD",
                  color: "#4C4845",
                  fontSize: "11px",
                  padding: "0 10px",
                  gap: "5px",
                }}
              >
                <Link2 size={13} />
                {photographer.other_link_label || "Link"}
              </a>
            )}
          </div>
        )}

        <div style={{ height: "0.5px", background: "#EEEAE4", margin: "20px 0" }} />

        <PortfolioGrid items={media} />

        <div style={{ height: "0.5px", background: "#EEEAE4", margin: "24px 0" }} />

        <ContactReviewsCard
          photographerId={photographer.id}
          photographerName={name}
          slug={slug}
          isLoggedIn={Boolean(user)}
          email={photographer.public_email}
          phone={photographer.public_phone}
          reviews={reviews}
          totalCount={reviewCount}
          avgRating={avgRating}
          currentUserId={user?.id ?? null}
          isOwnProfile={user?.id === photographer.user_id}
          hasExistingReview={hasExistingReview}
        />

        {/* Report link */}
        <div style={{ paddingTop: "4px", borderTop: "0.5px solid #EEEAE4" }}>
          <ReportModal photographerId={photographer.id} photographerName={name} />
        </div>
      </div>
    </div>
  );
}
