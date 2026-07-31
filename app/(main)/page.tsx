import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HomeSearchBar } from "@/components/search/HomeSearchBar";
import { NearbyPhotographers } from "@/components/home/nearby-photographers";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: specialties } = await supabase
    .from("specialties")
    .select("*")
    .order("name");

  return (
    <div style={{ backgroundColor: "var(--brand-bg-page)" }} className="min-h-[calc(100vh-4rem)]">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
        <h1
          className="leading-[1.1]"
          style={{
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 5vw, 52px)",
            letterSpacing: "-1.5px",
            color: "var(--brand-text-primary)",
          }}
        >
          Find your photographer.
        </h1>
        <p
          className="mx-auto max-w-[480px]"
          style={{ fontWeight: 400, fontSize: "15px", color: "var(--brand-text-muted)" }}
        >
          Foto connects clients with photographers by specialty,
          location, price, and availability.
        </p>

        <HomeSearchBar specialties={specialties ?? []} />

        <p style={{ fontSize: "13px", color: "var(--brand-text-muted)" }}>
          Are you a photographer?{" "}
          <Link
            href="/signup"
            className="border-b pb-px font-semibold no-underline"
            style={{
              color: "var(--brand-text-primary)",
              borderColor: "var(--brand-text-primary)",
            }}
          >
            Join Foto
          </Link>
        </p>
      </div>

      <div style={{ borderTop: "1px solid var(--brand-border)" }} />

      <NearbyPhotographers />
    </div>
  );
}
