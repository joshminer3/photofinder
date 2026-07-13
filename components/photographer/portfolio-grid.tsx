"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type PortfolioMedia = {
  id: string;
  url: string;
  type: "photo" | "video";
};

export function PortfolioGrid({ items }: { items: PortfolioMedia[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photos = items.filter((i) => i.type === "photo");
  const videos = items.filter((i) => i.type === "video");

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photos.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="relative aspect-square overflow-hidden rounded-lg bg-muted"
          >
            <Image
              src={item.url}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform hover:scale-105"
            />
          </button>
        ))}
        {videos.map((item) => (
          <div
            key={item.id}
            className="relative aspect-square overflow-hidden rounded-lg bg-black"
          >
            <video
              src={item.url}
              controls
              playsInline
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>

      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
      >
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Portfolio photo</DialogTitle>
          {lightboxIndex !== null && (
            <div className="relative aspect-square w-full">
              <Image
                src={photos[lightboxIndex].url}
                alt=""
                fill
                sizes="100vw"
                className="rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
