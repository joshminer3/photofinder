"use client";

import { ExternalLink } from "lucide-react";

export function ViewProfileButton({ slug }: { slug: string }) {
  return (
    <button
      type="button"
      onClick={() => window.open(`/photographer/${slug}`, "_blank")}
      className="flex shrink-0 items-center rounded-[6px] border-none"
      style={{
        height: "32px",
        background: "#111010",
        color: "#FDFCFB",
        fontSize: "12px",
        fontWeight: 500,
        padding: "0 14px",
        gap: "5px",
      }}
    >
      <ExternalLink size={13} />
      View my profile
    </button>
  );
}
