"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { MatchedPhotographer } from "@/lib/agent/types";

export function AgentPhotographerCard({ photographer }: { photographer: MatchedPhotographer }) {
  const router = useRouter();

  const priceLabel = photographer.priceRangeMin ? `From $${photographer.priceRangeMin}` : null;

  return (
    <div
      className="flex overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E6E2DD",
        borderRadius: "8px",
        margin: "0 12px 10px",
      }}
    >
      <div className="relative h-auto w-[80px] shrink-0" style={{ background: "#E6E2DD" }}>
        {photographer.coverImageUrl && (
          <Image src={photographer.coverImageUrl} alt="" fill sizes="80px" className="object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1" style={{ padding: "10px 12px" }}>
        <div className="flex items-center justify-between" style={{ gap: "8px" }}>
          <span
            className="truncate"
            style={{ fontSize: "13px", fontWeight: 500, color: "#111010", letterSpacing: "-0.3px" }}
          >
            {photographer.name}
          </span>
          <span
            className="shrink-0 rounded-full"
            style={{
              background: "#E6E2DD",
              color: "#302D2B",
              fontSize: "10px",
              fontWeight: 500,
              padding: "2px 8px",
            }}
          >
            {photographer.primarySpecialty}
          </span>
        </div>

        <div className="flex flex-wrap items-center" style={{ gap: "6px", marginTop: "2px" }}>
          {photographer.serviceArea && (
            <span style={{ fontSize: "11px", color: "#7A7572" }}>{photographer.serviceArea}</span>
          )}
          {priceLabel && <span style={{ fontSize: "11px", color: "#7A7572" }}>· {priceLabel}</span>}
          {photographer.avgRating != null && (
            <span style={{ fontSize: "11px", color: "#B8762E" }}>
              · {photographer.avgRating.toFixed(1)}★ ({photographer.reviewCount})
            </span>
          )}
        </div>

        <p style={{ fontSize: "12px", color: "#4C4845", lineHeight: 1.55, margin: "6px 0 8px" }}>
          {photographer.explanation}
        </p>

        <button
          type="button"
          onClick={() => router.push(`/photographer/${photographer.slug}`)}
          className="w-full border-none"
          style={{
            height: "28px",
            background: "#111010",
            color: "#FDFCFB",
            borderRadius: "5px",
            fontSize: "11px",
            fontWeight: 500,
          }}
        >
          View profile
        </button>
      </div>
    </div>
  );
}
