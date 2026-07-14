import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSearchBox } from "@/components/admin/admin-search-box";
import { SuspendButton } from "@/components/admin/suspend-button";

const PAGE_SIZE = 25;

export default async function AdminPhotographersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const sort = typeof params.sort === "string" ? params.sort : "joined";
  const page = typeof params.page === "string" ? Math.max(1, Number(params.page) || 1) : 1;

  const supabase = createAdminClient();

  let query = supabase
    .from("photographer_profiles")
    .select(
      "id, slug, primary_specialty, service_area, created_at, user_id, profiles!inner(full_name, is_approved)",
    )
    .eq("profiles.is_approved", true);

  if (q) query = query.ilike("profiles.full_name", `%${q}%`);

  const { data: photographers } = await query;
  const rows = photographers ?? [];

  const photographerIds = rows.map((p) => p.id);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("photographer_id")
    .in("photographer_id", photographerIds.length > 0 ? photographerIds : [""]);

  const reviewCounts = new Map<string, number>();
  for (const r of reviews ?? []) {
    reviewCounts.set(r.photographer_id, (reviewCounts.get(r.photographer_id) ?? 0) + 1);
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, photographer_id")
    .in("photographer_id", photographerIds.length > 0 ? photographerIds : [""]);

  const conversationToPhotographer = new Map<string, string>();
  for (const c of conversations ?? []) {
    conversationToPhotographer.set(c.id, c.photographer_id);
  }
  const conversationIds = [...conversationToPhotographer.keys()];

  const messageCounts = new Map<string, number>();
  if (conversationIds.length > 0) {
    const { data: messages } = await supabase
      .from("messages")
      .select("conversation_id, sender_id")
      .in("conversation_id", conversationIds);

    const photographerUserIds = new Map(rows.map((p) => [p.id, p.user_id]));
    for (const m of messages ?? []) {
      const photographerId = conversationToPhotographer.get(m.conversation_id);
      if (!photographerId) continue;
      // "received" = sent by the client, not by the photographer themselves
      if (m.sender_id === photographerUserIds.get(photographerId)) continue;
      messageCounts.set(photographerId, (messageCounts.get(photographerId) ?? 0) + 1);
    }
  }

  const enriched = rows.map((p) => ({
    ...p,
    reviewCount: reviewCounts.get(p.id) ?? 0,
    messageCount: messageCounts.get(p.id) ?? 0,
  }));

  enriched.sort((a, b) => {
    if (sort === "reviews") return b.reviewCount - a.reviewCount;
    if (sort === "messages") return b.messageCount - a.messageCount;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const total = enriched.length;
  const start = (page - 1) * PAGE_SIZE;
  const pageRows = enriched.slice(start, start + PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function sortLink(key: string, label: string) {
    const params2 = new URLSearchParams();
    if (q) params2.set("q", q);
    params2.set("sort", key);
    return (
      <Link
        href={`/admin/photographers?${params2.toString()}`}
        className={sort === key ? "font-semibold" : "text-muted-foreground hover:underline"}
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">All Photographers — {total}</h1>

      <div className="flex items-center justify-between gap-4">
        <AdminSearchBox placeholder="Search by name..." />
        <div className="flex gap-3 text-sm">
          Sort: {sortLink("joined", "Joined")} · {sortLink("reviews", "Reviews")} ·{" "}
          {sortLink("messages", "Messages")}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Specialty</th>
              <th className="p-3">Location</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Reviews</th>
              <th className="p-3">Messages</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">{p.profiles?.full_name ?? "—"}</td>
                <td className="p-3">{p.primary_specialty}</td>
                <td className="p-3">{p.service_area ?? "—"}</td>
                <td className="p-3">
                  {new Date(p.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="p-3">{p.reviewCount}</td>
                <td className="p-3">{p.messageCount}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/photographer/${p.slug}`}
                      target="_blank"
                      className="text-sm underline"
                    >
                      View
                    </Link>
                    <SuspendButton photographerId={p.id} />
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No photographers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params2 = new URLSearchParams();
            if (q) params2.set("q", q);
            params2.set("sort", sort);
            params2.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/admin/photographers?${params2.toString()}`}
                className={p === page ? "font-semibold" : "text-muted-foreground hover:underline"}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
