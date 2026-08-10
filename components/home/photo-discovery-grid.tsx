import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TARGET_PHOTO_COUNT = 18;

type DiscoveryPhoto = {
  slug: string;
  name: string;
  imageUrl: string;
};

async function getDiscoveryPhotos(): Promise<DiscoveryPhoto[]> {
  const supabase = await createClient();

  const { data: photographers } = await supabase
    .from("photographer_profiles")
    .select("id, slug, profiles!inner(full_name, is_approved, is_photographer)")
    .eq("profiles.is_approved", true)
    .eq("profiles.is_photographer", true);

  const photographerList = photographers ?? [];
  if (photographerList.length === 0) return [];

  const photographerById = new Map(photographerList.map((p) => [p.id, p]));

  // Pull every photo from every approved photographer's portfolio (not just
  // their cover photo) so the random sample below can draw from the full pool.
  const { data: portfolioItems } = await supabase
    .from("portfolio_items")
    .select("photographer_id, storage_path")
    .in("photographer_id", photographerList.map((p) => p.id))
    .eq("type", "photo");

  const items: DiscoveryPhoto[] = (portfolioItems ?? [])
    .map((item) => {
      const photographer = photographerById.get(item.photographer_id);
      if (!photographer) return null;
      return {
        slug: photographer.slug,
        name: photographer.profiles?.full_name ?? "Photographer",
        imageUrl: supabase.storage.from("portfolios").getPublicUrl(item.storage_path).data
          .publicUrl,
      };
    })
    .filter((item): item is DiscoveryPhoto => item !== null);

  // Fisher-Yates — random photos from across all portfolios, not just one
  // (the cover) per photographer, so the grid doesn't feel repetitive.
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return items.slice(0, TARGET_PHOTO_COUNT);
}

export async function PhotoDiscoveryGrid() {
  const photos = await getDiscoveryPhotos();
  if (photos.length === 0) return null;

  return (
    <div className="mx-auto" style={{ maxWidth: "900px", padding: "28px 24px 40px" }}>
      <div
        className="flex items-baseline justify-between max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-1"
        style={{ marginBottom: "16px" }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 500, color: "#111010", letterSpacing: "-0.3px" }}>
          Browse photographers
        </h2>
        <p style={{ fontSize: "12px", color: "#7A7572" }}>Click any photo to view their profile</p>
      </div>

      <div className="columns-3 max-[640px]:columns-2" style={{ columnGap: "6px" }}>
        {photos.map((photo) => (
          <Link
            key={photo.imageUrl}
            href={`/photographer/${photo.slug}`}
            className="group relative block break-inside-avoid overflow-hidden rounded-[6px]"
            style={{ marginBottom: "6px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- natural, unknown aspect ratio is the point of the masonry effect; next/image requires known width+height. */}
            <img
              src={photo.imageUrl}
              alt={`${photo.name}'s photography`}
              loading="lazy"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <div
              className="absolute inset-x-0 bottom-0 flex items-end opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{
                padding: "24px 10px 10px",
                background: "linear-gradient(to top, rgba(17,16,16,0.65) 0%, transparent 100%)",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#FDFCFB", letterSpacing: "-0.2px" }}>
                {photo.name}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <Link
          href="/search"
          style={{
            fontSize: "13px",
            color: "#7A7572",
            borderBottom: "1px solid #B8B3AE",
            paddingBottom: "1px",
            textDecoration: "none",
          }}
        >
          View all photographers →
        </Link>
      </div>
    </div>
  );
}
