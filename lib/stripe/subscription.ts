import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Service role client — subscription columns are never exposed to the
// anon/authenticated Supabase client, only touched server-side here and in
// the webhook/API routes.
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "inactive";

export async function getSubscriptionStatus(userId: string): Promise<{
  status: SubscriptionStatus;
  periodEnd: Date | null;
}> {
  const { data } = await supabase
    .from("photographer_profiles")
    .select("subscription_status, subscription_period_end")
    .eq("user_id", userId)
    .single();

  return {
    status: (data?.subscription_status as SubscriptionStatus | undefined) ?? "inactive",
    periodEnd: data?.subscription_period_end ? new Date(data.subscription_period_end) : null,
  };
}

export function isSubscriptionActive(
  status: SubscriptionStatus,
  periodEnd: Date | null,
): boolean {
  if (status === "active") return true;
  // Grace period: still treat as active if past_due but within the period
  // that was already paid for.
  if (status === "past_due" && periodEnd && periodEnd > new Date()) return true;
  return false;
}
