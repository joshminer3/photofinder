import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HomeSearchBar } from "@/components/search/HomeSearchBar";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: specialties } = await supabase
    .from("specialties")
    .select("*")
    .order("name");

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Find your photographer.
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Foto connects clients in Utah with photographers by specialty,
        location, price, and availability.
      </p>

      <HomeSearchBar specialties={specialties ?? []} />

      <p className="text-sm text-muted-foreground">
        Are you a photographer?{" "}
        <Link href="/signup" className="font-medium text-foreground underline">
          Join Foto
        </Link>
      </p>
    </div>
  );
}
