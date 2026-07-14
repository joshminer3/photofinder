import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const supabase = createAdminClient();
  const { count: pendingCount } = await supabase
    .from("photographer_profiles")
    .select("id, profiles!inner(is_approved)", { count: "exact", head: true })
    .eq("profiles.is_approved", false)
    .is("rejected_at", null)
    .is("suspended_at", null);

  const { count: unresolvedReports } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .is("resolved_at", null);

  const NAV_ITEMS = [
    { label: "Pending Approval", href: "/admin/pending", count: pendingCount },
    { label: "All Photographers", href: "/admin/photographers" },
    { label: "All Users", href: "/admin/users" },
    { label: "Flagged Content", href: "/admin/flagged", count: unresolvedReports },
    { label: "Platform Stats", href: "/admin/stats" },
  ];

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="flex shrink-0 flex-col gap-1 border-b p-4 sm:w-56 sm:border-r sm:border-b-0">
        <p className="mb-4 px-2 text-sm font-semibold text-muted-foreground">
          Foto Admin
        </p>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            {item.label}
            {Boolean(item.count) && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {item.count}
              </span>
            )}
          </Link>
        ))}
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
