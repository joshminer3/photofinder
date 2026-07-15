import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

type NearbyPhotographer = {
  slug: string;
  name: string;
  serviceArea: string | null;
  specialty: string;
  priceLabel: string | null;
  coverUrl: string | null;
};

async function getNearbyPhotographers(): Promise<NearbyPhotographer[]> {
  const supabase = await createClient();

  const { data: photographers } = await supabase
    .from("photographer_profiles")
    .select(
      "id, slug, primary_specialty, service_area, price_range_min, price_range_max, profiles!inner(full_name, is_approved)",
    )
    .eq("profiles.is_approved", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!photographers || photographers.length === 0) return [];

  return Promise.all(
    photographers.map(async (p) => {
      const { data: firstPhoto } = await supabase
        .from("portfolio_items")
        .select("storage_path")
        .eq("photographer_id", p.id)
        .eq("type", "photo")
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      const coverUrl = firstPhoto
        ? supabase.storage.from("portfolios").getPublicUrl(firstPhoto.storage_path).data
            .publicUrl
        : null;

      return {
        slug: p.slug,
        name: p.profiles?.full_name ?? "Photographer",
        serviceArea: p.service_area,
        specialty: p.primary_specialty,
        priceLabel:
          p.price_range_min || p.price_range_max
            ? `$${p.price_range_min ?? "?"}–$${p.price_range_max ?? "?"}`
            : null,
        coverUrl,
      };
    }),
  );
}

export async function NearbyPhotographers() {
  const photographers = await getNearbyPhotographers();
  if (photographers.length === 0) return null;

  return (
    <div
      className="mx-auto"
      style={{ maxWidth: "900px", padding: "32px 24px 48px" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2
          style={{
            fontSize: "15px",
            fontWeight: 700,
            letterSpacing: "-0.4px",
            color: "var(--brand-text-primary)",
          }}
        >
          Photographers near you
        </h2>
        <Link
          href="/search"
          style={{ fontSize: "12px", color: "var(--brand-text-muted)" }}
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {photographers.map((p) => (
          <Link
            key={p.slug}
            href={`/photographer/${p.slug}`}
            className="block overflow-hidden rounded-[10px] border"
            style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-bg-card)" }}
          >
            <div
              className="relative"
              style={{ height: "160px", backgroundColor: "var(--brand-border)" }}
            >
              {p.coverUrl && (
                <Image
                  src={p.coverUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 300px"
                  className="object-cover"
                />
              )}
            </div>
            <div style={{ padding: "12px" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "-0.3px",
                  color: "var(--brand-text-primary)",
                }}
              >
                {p.name}
              </p>
              {p.serviceArea && (
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--brand-text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  {p.serviceArea}
                </p>
              )}
              <span
                className="inline-block"
                style={{
                  backgroundColor: "var(--brand-border)",
                  color: "#302D2B",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "20px",
                }}
              >
                {p.specialty}
              </span>
              {p.priceLabel && (
                <span
                  className="float-right"
                  style={{ fontSize: "11px", color: "var(--brand-text-mid)", fontWeight: 500 }}
                >
                  {p.priceLabel}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
