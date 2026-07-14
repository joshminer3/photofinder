import { createAdminClient } from "@/lib/supabase/admin";
import { PendingPhotographerCard } from "@/components/admin/pending-photographer-card";

export default async function AdminPendingPage() {
  const supabase = createAdminClient();

  const { data: pending } = await supabase
    .from("photographer_profiles")
    .select(
      "id, slug, bio, primary_specialty, service_area, created_at, profiles!inner(full_name, is_approved)",
    )
    .eq("profiles.is_approved", false)
    .is("rejected_at", null)
    .is("suspended_at", null)
    .order("created_at", { ascending: true });

  const photographers = pending ?? [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">
        Pending Approval — {photographers.length} pending
      </h1>

      {photographers.length === 0 ? (
        <p className="text-muted-foreground">Nothing waiting on review.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {photographers.map((p) => (
            <PendingPhotographerCard
              key={p.id}
              photographerId={p.id}
              slug={p.slug}
              name={p.profiles?.full_name ?? "Unknown"}
              specialty={p.primary_specialty}
              location={p.service_area}
              bio={p.bio}
              submittedAt={p.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
