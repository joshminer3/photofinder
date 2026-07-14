import { createAdminClient } from "@/lib/supabase/admin";

function sevenDaysAgoIso() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-6 text-center">
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function AdminStatsPage() {
  const supabase = createAdminClient();
  const sevenDaysAgo = sevenDaysAgoIso();

  const [
    { count: totalPhotographers },
    { count: pendingApproval },
    { count: totalClients },
    { count: totalConversations },
    { count: messagesLast7d },
    { count: newSignupsLast7d },
    { data: allRatings },
    { count: totalReviews },
  ] = await Promise.all([
    supabase
      .from("photographer_profiles")
      .select("id, profiles!inner(is_approved)", { count: "exact", head: true })
      .eq("profiles.is_approved", true),
    supabase
      .from("photographer_profiles")
      .select("id, profiles!inner(is_approved)", { count: "exact", head: true })
      .eq("profiles.is_approved", false)
      .is("rejected_at", null)
      .is("suspended_at", null),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_photographer", false),
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase.from("reviews").select("rating"),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
  ]);

  const avgRating =
    allRatings && allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Platform Stats</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Photographers" value={totalPhotographers ?? 0} />
        <StatCard label="Pending Approval" value={pendingApproval ?? 0} />
        <StatCard label="Total Clients" value={totalClients ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Conversations" value={totalConversations ?? 0} />
        <StatCard label="Messages (last 7d)" value={messagesLast7d ?? 0} />
        <StatCard label="New Signups (last 7d)" value={newSignupsLast7d ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Avg Rating (platform-wide)" value={avgRating.toFixed(1)} />
        <StatCard label="Total Reviews" value={totalReviews ?? 0} />
      </div>
    </div>
  );
}
