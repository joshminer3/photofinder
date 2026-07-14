import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AtSign, Globe, Link2, Mail, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageButton } from "@/components/photographer/message-button";
import { SaveButton } from "@/components/photographer/save-button";
import {
  PortfolioGrid,
  type PortfolioMedia,
} from "@/components/photographer/portfolio-grid";
import { ReviewsSection, type ReviewWithReviewer } from "@/components/reviews/reviews-section";
import { ReportModal } from "@/components/reports/report-modal";

const REVIEWS_PAGE_SIZE = 5;

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
    supabase.from("reviews").select("rating").eq("photographer_id", photographer.id),
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

  const priceLabel =
    photographer.price_range_min || photographer.price_range_max
      ? `$${photographer.price_range_min ?? "?"}–$${photographer.price_range_max ?? "?"}`
      : null;

  return (
    <div className="flex flex-col">
      {coverPhoto && (
        <div className="relative h-64 w-full sm:h-96">
          <Image
            src={coverPhoto.url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-4 border-background shadow">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{name}</h1>
              <Badge variant="secondary" className="mt-1">
                {photographer.primary_specialty}
              </Badge>
            </div>
          </div>
          <SaveButton
            photographerId={photographer.id}
            slug={slug}
            isLoggedIn={Boolean(user)}
            initialSaved={initialSaved}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {photographer.service_area && <span>{photographer.service_area}</span>}
          {priceLabel && (
            <>
              <span>·</span>
              <span>{priceLabel}</span>
            </>
          )}
          <span>·</span>
          <Badge variant={photographer.available_this_month ? "default" : "outline"}>
            {photographer.available_this_month
              ? "Available this month"
              : "Limited availability"}
          </Badge>
        </div>

        {photographer.bio && (
          <p className="max-w-2xl leading-relaxed text-foreground/90">
            {photographer.bio}
          </p>
        )}

        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <MessageButton
            photographerId={photographer.id}
            slug={slug}
            isLoggedIn={Boolean(user)}
          />
          <div className="flex flex-wrap gap-4 text-sm">
            {photographer.public_email && (
              <a
                href={`mailto:${photographer.public_email}`}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Mail className="size-4" />
                {photographer.public_email}
              </a>
            )}
            {photographer.public_phone && (
              <a
                href={`tel:${photographer.public_phone}`}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Phone className="size-4" />
                {photographer.public_phone}
              </a>
            )}
          </div>
        </div>

        {(photographer.instagram_url ||
          photographer.website_url ||
          photographer.other_link_url) && (
          <div className="flex flex-wrap items-center gap-4">
            {photographer.instagram_url && (
              <a
                href={photographer.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <AtSign className="size-4" />
                Instagram
              </a>
            )}
            {photographer.website_url && (
              <a
                href={photographer.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Globe className="size-4" />
                Website
              </a>
            )}
            {photographer.other_link_url && (
              <a
                href={photographer.other_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <Link2 className="size-4" />
                {photographer.other_link_label || "Link"}
              </a>
            )}
          </div>
        )}

        <PortfolioGrid items={media} />

        <div className="flex flex-wrap gap-2">
          {specialties.map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>

        <ReviewsSection
          photographerId={photographer.id}
          photographerName={name}
          reviews={reviews}
          totalCount={reviewCount}
          avgRating={avgRating}
          currentUserId={user?.id ?? null}
          isOwnProfile={user?.id === photographer.user_id}
        />

        <div className="pt-2">
          <ReportModal photographerId={photographer.id} photographerName={name} />
        </div>
      </div>
    </div>
  );
}
