import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { label: "Profile", href: "/dashboard/profile" },
  { label: "Analytics" },
  { label: "Billing" },
  { label: "Reviews" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_photographer")
    .eq("id", user.id)
    .single();
  if (!profile?.is_photographer) redirect("/");

  const { data: photographerProfile } = await supabase
    .from("photographer_profiles")
    .select("slug")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!photographerProfile) redirect("/onboarding");

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b p-3 sm:w-56 sm:flex-col sm:items-stretch sm:border-r sm:border-b-0 sm:p-4">
        <Link
          href="/"
          className="mb-0 flex items-center gap-2 px-2 py-1.5 font-semibold sm:mb-4"
        >
          <Camera className="size-5" />
          Foto
        </Link>
        {NAV_ITEMS.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span
              key={item.label}
              className="cursor-not-allowed rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted-foreground/50"
            >
              {item.label}
            </span>
          ),
        )}
        <Link
          href={`/photographer/${photographerProfile.slug}`}
          className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground sm:mt-auto"
        >
          View my profile →
        </Link>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
