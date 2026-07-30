"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type PortfolioMedia = {
  id: string;
  url: string;
  type: "photo" | "video";
};

export function PortfolioGrid({ items }: { items: PortfolioMedia[] }) {
  const photos = items.filter((i) => i.type === "photo").slice(0, 30);
  const videos = items.filter((i) => i.type === "video");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
      }
    }
    // Capture phase: Base UI's Dialog stops propagation on keydown internally
    // (for its own focus handling), so a bubble-phase listener here would
    // never see real key presses. Capture fires top-down before that.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [lightboxIndex, photos.length]);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col" style={{ gap: "6px" }}>
      <div className="grid grid-cols-3" style={{ gap: "6px" }}>
        {photos.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="relative overflow-hidden border-none p-0"
            style={{ aspectRatio: "1", borderRadius: "6px", background: "#E6E2DD", cursor: "pointer" }}
          >
            <Image
              src={item.url}
              alt=""
              fill
              sizes="(max-width: 640px) 33vw, 240px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {videos.map((item) => (
        <div
          key={item.id}
          className="relative overflow-hidden"
          style={{ aspectRatio: "16/9", borderRadius: "6px", background: "#000000" }}
        >
          <video src={item.url} controls playsInline className="size-full object-cover" />
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.85)" }}
            >
              <Play size={18} color="#111010" fill="#111010" />
            </div>
          </div>
        </div>
      ))}

      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
      >
        <DialogContent
          className="flex w-auto max-w-none items-center justify-center border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">Portfolio photo</DialogTitle>
          {lightboxIndex !== null && (
            // This wrapper is intentionally un-sized — it shrinks to exactly
            // the image's own rendered box (via the image's width/height:
            // auto below), so the nav buttons positioned absolutely inside
            // it hug the image's actual edges instead of some oversized
            // fixed-size dialog box.
            <div className="relative" style={{ lineHeight: 0 }}>
              <Image
                src={photos[lightboxIndex].url}
                alt=""
                width={1600}
                height={1200}
                sizes="92vw"
                className="block rounded-lg object-contain"
                style={{ width: "auto", height: "auto", maxWidth: "92vw", maxHeight: "88vh" }}
                priority
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
                    }}
                    aria-label="Previous photo"
                    className="absolute flex items-center justify-center rounded-full border-none"
                    style={{
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "40px",
                      height: "40px",
                      background: "rgba(17,16,16,0.6)",
                    }}
                  >
                    <ChevronLeft size={22} color="#FDFCFB" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
                    }}
                    aria-label="Next photo"
                    className="absolute flex items-center justify-center rounded-full border-none"
                    style={{
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "40px",
                      height: "40px",
                      background: "rgba(17,16,16,0.6)",
                    }}
                  >
                    <ChevronRight size={22} color="#FDFCFB" />
                  </button>
                  <span
                    className="absolute"
                    style={{
                      bottom: "12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: "12px",
                      color: "#FDFCFB",
                      background: "rgba(17,16,16,0.6)",
                      padding: "4px 10px",
                      borderRadius: "20px",
                    }}
                  >
                    {lightboxIndex + 1} / {photos.length}
                  </span>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
