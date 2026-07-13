"use client";

import { useRef, useState } from "react";
import { X, GripVertical, Film } from "lucide-react";
import {
  MAX_PHOTOS,
  MAX_VIDEOS,
  useOnboarding,
  type PortfolioDraftItem,
} from "./onboarding-context";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StepPortfolio() {
  const { data, update } = useOnboarding();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const photos = data.portfolioItems.filter((i) => i.type === "photo");
  const videos = data.portfolioItems.filter((i) => i.type === "video");

  function addFiles(files: FileList | null, type: "photo" | "video") {
    if (!files) return;
    const existingCount = data.portfolioItems.filter(
      (i) => i.type === type,
    ).length;
    const limit = type === "photo" ? MAX_PHOTOS : MAX_VIDEOS;
    const room = Math.max(0, limit - existingCount);

    const newItems: PortfolioDraftItem[] = Array.from(files)
      .slice(0, room)
      .map((file) => ({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        type,
      }));

    update({ portfolioItems: [...data.portfolioItems, ...newItems] });
  }

  function removeItem(localId: string) {
    update({
      portfolioItems: data.portfolioItems.filter(
        (i) => i.localId !== localId,
      ),
    });
  }

  function reorder(fromLocalId: string, toLocalId: string) {
    const items = [...data.portfolioItems];
    const fromIdx = items.findIndex((i) => i.localId === fromLocalId);
    const toIdx = items.findIndex((i) => i.localId === toLocalId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    update({ portfolioItems: items });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Your portfolio</h2>
        <p className="text-sm text-muted-foreground">
          Up to {MAX_PHOTOS} photos and {MAX_VIDEOS} videos. Drag to reorder —
          the first photo becomes your profile&apos;s cover image.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Photos ({photos.length}/{MAX_PHOTOS})</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={photos.length >= MAX_PHOTOS}
            onClick={() => photoInputRef.current?.click()}
          >
            Add photos
          </Button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files, "photo");
              e.target.value = "";
            }}
          />
        </div>
        <MediaGrid
          items={photos}
          onRemove={removeItem}
          onReorder={reorder}
          dragIndex={dragIndex}
          setDragIndex={setDragIndex}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Videos ({videos.length}/{MAX_VIDEOS})</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={videos.length >= MAX_VIDEOS}
            onClick={() => videoInputRef.current?.click()}
          >
            Add videos
          </Button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files, "video");
              e.target.value = "";
            }}
          />
        </div>
        <MediaGrid
          items={videos}
          onRemove={removeItem}
          onReorder={reorder}
          dragIndex={dragIndex}
          setDragIndex={setDragIndex}
        />
      </div>
    </div>
  );
}

function MediaGrid({
  items,
  onRemove,
  onReorder,
  dragIndex,
  setDragIndex,
}: {
  items: PortfolioDraftItem[];
  onRemove: (localId: string) => void;
  onReorder: (fromLocalId: string, toLocalId: string) => void;
  dragIndex: number | null;
  setDragIndex: (i: number | null) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nothing uploaded yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {items.map((item, index) => (
        <div
          key={item.localId}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && dragIndex !== index) {
              onReorder(items[dragIndex].localId, item.localId);
            }
            setDragIndex(null);
          }}
          className={cn(
            "group relative aspect-square cursor-grab overflow-hidden rounded-lg border bg-muted",
            dragIndex === index && "opacity-50",
          )}
        >
          {item.type === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.previewUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted">
              <Film className="size-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-1 opacity-0 group-hover:opacity-100">
            <GripVertical className="size-4 text-white" />
            <button
              type="button"
              onClick={() => onRemove(item.localId)}
              className="rounded-full bg-black/60 p-1 text-white"
              aria-label="Remove"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function stepPortfolioIsValid(data: {
  portfolioItems: PortfolioDraftItem[];
}) {
  return data.portfolioItems.filter((i) => i.type === "photo").length > 0;
}
