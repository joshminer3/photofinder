"use client";

import { X } from "lucide-react";
import { MAX_AGENT_PHOTOS } from "@/lib/agent/constants";

export function AgentPhotoPreview({
  photos,
  onRemove,
}: {
  photos: { file: File; previewUrl: string }[];
  onRemove: (index: number) => void;
}) {
  if (photos.length === 0) return null;

  return (
    <div className="flex items-center" style={{ gap: "8px", marginBottom: "8px" }}>
      <div className="flex overflow-x-auto" style={{ gap: "6px" }}>
        {photos.map((photo, index) => (
          <div
            key={photo.previewUrl}
            className="relative shrink-0 overflow-hidden"
            style={{ width: "48px", height: "48px", borderRadius: "6px", background: "#E6E2DD" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.previewUrl} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label="Remove photo"
              className="absolute flex items-center justify-center rounded-full"
              style={{ top: "2px", right: "2px", width: "16px", height: "16px", background: "rgba(0,0,0,0.5)" }}
            >
              <X size={10} color="#FFFFFF" />
            </button>
          </div>
        ))}
      </div>
      <span className="shrink-0" style={{ fontSize: "10px", color: "#7A7572" }}>
        {photos.length}/{MAX_AGENT_PHOTOS} photos
      </span>
    </div>
  );
}
