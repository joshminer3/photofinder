import Link from "next/link";
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
};

export function PhotographerCard({
  photographer,
}: {
  photographer: SearchPhotographer;
}) {
  const priceLabel =
    photographer.price_range_min || photographer.price_range_max
      ? `$${photographer.price_range_min ?? "?"}–$${photographer.price_range_max ?? "?"}`
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
            <Badge variant="secondary" className="mt-1">
              {photographer.primary_specialty}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {photographer.service_area && <span>{photographer.service_area}</span>}
          {priceLabel && (
            <>
              <span>·</span>
              <span>{priceLabel}</span>
            </>
          )}
        </div>

        {photographer.available_this_month && (
          <Badge className="w-fit">Available this month</Badge>
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
