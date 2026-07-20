import { UserPen, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/dashboard/get-stats";
import { ViewProfileButton } from "@/components/dashboard/view-profile-button";
import { StatCard } from "@/components/dashboard/stat-card";
import { AvailabilityToggle } from "@/components/dashboard/availability-toggle";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirects; satisfies TS

  const { data: photographer } = await supabase
    .from("photographer_profiles")
    .select("id, slug, available_this_month")
    .eq("user_id", user.id)
    .single();
  if (!photographer) return null; // layout already redirects to /onboarding

  const stats = await getDashboardStats(photographer.id, user.id);

  const ratingValue = stats.avgRating !== null ? stats.avgRating.toFixed(1) : "—";
  const ratingLabel =
    stats.reviewCount > 0
      ? `Avg. rating (${stats.reviewCount} review${stats.reviewCount === 1 ? "" : "s"})`
      : "Avg. rating (no reviews yet)";

  return (
    <div style={{ padding: "24px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 500, color: "#111010", letterSpacing: "-0.5px" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "12px", color: "#7A7572", marginTop: "2px" }}>
            Here&apos;s how your profile is performing.
          </p>
        </div>
        <ViewProfileButton slug={photographer.slug} />
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-3"
        style={{ gap: "10px", marginBottom: "16px" }}
      >
        <StatCard value="—" label="Profile views" note="Available soon" />
        <StatCard value={String(stats.messagesReceived)} label="Messages received" />
        <StatCard value={ratingValue} label={ratingLabel} />
      </div>

      <AvailabilityToggle userId={user.id} initialValue={photographer.available_this_month} />

      <div className="flex flex-col" style={{ gap: "10px" }}>
        <QuickActionCard
          icon={<UserPen size={16} color="#4C4845" />}
          title="Edit your profile"
          subtitle="Update bio, portfolio, links and contact info"
          buttonText="Edit →"
          filled={false}
          href="/dashboard/profile"
        />
        <QuickActionCard
          icon={<MessageCircle size={16} color="#4C4845" />}
          title="Messages"
          subtitle={
            stats.unreadCount > 0
              ? `${stats.unreadCount} unread message${stats.unreadCount === 1 ? "" : "s"}`
              : "No unread messages"
          }
          buttonText="Open →"
          filled={stats.unreadCount > 0}
          href="/messages"
        />
      </div>
    </div>
  );
}
