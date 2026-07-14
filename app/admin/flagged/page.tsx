import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRelativeTime } from "@/lib/format-time";
import { ReportActions } from "@/components/admin/report-actions";

export default async function AdminFlaggedPage() {
  const supabase = createAdminClient();

  const { data: reports } = await supabase
    .from("reports")
    .select(
      "id, reason, details, reporter_id, created_at, photographer_profiles(slug, profiles(full_name))",
    )
    .is("resolved_at", null)
    .order("created_at", { ascending: true });

  const rows = reports ?? [];

  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? "—"]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Flagged Content — {rows.length}</h1>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">No unresolved reports.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Reported {formatRelativeTime(r.created_at)} ago by{" "}
                {r.reporter_id ? emailById.get(r.reporter_id) ?? "Unknown" : "Anonymous"}
              </p>
              <p className="mt-1 font-medium">
                Photographer: {r.photographer_profiles?.profiles?.full_name ?? "Unknown"}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Reason:</span> {r.reason}
              </p>
              {r.details && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Details:</span> &ldquo;{r.details}&rdquo;
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {r.photographer_profiles?.slug && (
                  <Link
                    href={`/photographer/${r.photographer_profiles.slug}`}
                    target="_blank"
                    className="text-sm underline"
                  >
                    View Profile
                  </Link>
                )}
                <ReportActions reportId={r.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
