"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = "size-4",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            size,
            n <= Math.round(rating)
              ? "fill-current text-yellow-500"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          className="p-0.5"
        >
          <Star
            className={cn(
              "size-8 transition-colors",
              n <= display ? "fill-current text-yellow-500" : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}
