import Link from "next/link";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type SearchPhotographer = {
  slug: string;
  primary_specialty: string;
  service_area: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  available_this_month: boolean;
  bio: string | null;
  full_name: string;
  avatar_url: string | null;
  avgRating?: number;
  reviewCount?: number;
};

function capitalizeLocation(location: string): string {
  return location
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function PhotographerCard({
  photographer,
}: {
  photographer: SearchPhotographer;
}) {
  const priceLabel =
    photographer.price_range_min && photographer.price_range_max
      ? `$${photographer.price_range_min}–$${photographer.price_range_max}`
      : photographer.price_range_min
        ? `From $${photographer.price_range_min}`
        : photographer.price_range_max
          ? `Up to $${photographer.price_range_max}`
          : null;

  const bioSnippet = photographer.bio
    ? photographer.bio.length > 100
      ? `${photographer.bio.slice(0, 100)}…`
      : photographer.bio
    : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage src={photographer.avatar_url ?? undefined} />
            <AvatarFallback>
              {photographer.full_name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold leading-tight">
              {photographer.full_name}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="secondary">{photographer.primary_specialty}</Badge>
              {Boolean(photographer.reviewCount) && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Star className="size-3 fill-current text-yellow-500" />
                  {photographer.avgRating?.toFixed(1)} ({photographer.reviewCount})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {photographer.service_area && (
            <span>{capitalizeLocation(photographer.service_area)}</span>
          )}
          {priceLabel && (
            <>
              <span>·</span>
              <span>{priceLabel}</span>
            </>
          )}
        </div>

        {photographer.available_this_month && (
          <Badge className="w-fit" style={{ background: "#F0EFED", color: "#4C4845" }}>
            Available this month
          </Badge>
        )}

        {bioSnippet && (
          <p className="text-sm text-muted-foreground">{bioSnippet}</p>
        )}

        <Button
          render={<Link href={`/photographer/${photographer.slug}`} />}
          nativeButton={false}
          variant="outline"
          className="mt-1 w-full"
        >
          View Profile →
        </Button>
      </CardContent>
    </Card>
  );
}
