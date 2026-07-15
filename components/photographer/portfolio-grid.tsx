import Image from "next/image";
import { Play } from "lucide-react";

export type PortfolioMedia = {
  id: string;
  url: string;
  type: "photo" | "video";
};

export function PortfolioGrid({ items }: { items: PortfolioMedia[] }) {
  const photos = items.filter((i) => i.type === "photo").slice(0, 30);
  const videos = items.filter((i) => i.type === "video");

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col" style={{ gap: "6px" }}>
      <div className="grid grid-cols-3" style={{ gap: "6px" }}>
        {photos.map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden"
            style={{ aspectRatio: "1", borderRadius: "6px", background: "#E6E2DD" }}
          >
            <Image
              src={item.url}
              alt=""
              fill
              sizes="(max-width: 640px) 33vw, 240px"
              className="object-cover"
            />
          </div>
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
    </div>
  );
}
