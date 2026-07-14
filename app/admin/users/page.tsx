import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSearchBox } from "@/components/admin/admin-search-box";
import { SuspendUserButton } from "@/components/admin/suspend-user-button";

const PAGE_SIZE = 25;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const page = typeof params.page === "string" ? Math.max(1, Number(params.page) || 1) : 1;

  const supabase = createAdminClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, created_at, is_suspended")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("full_name", `%${q}%`);

  const { data: profiles } = await query;
  const rows = profiles ?? [];

  const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? "—"]));

  const userIds = rows.map((p) => p.id);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("client_id")
    .in("client_id", userIds.length > 0 ? userIds : [""]);
  const conversationCounts = new Map<string, number>();
  for (const c of conversations ?? []) {
    conversationCounts.set(c.client_id, (conversationCounts.get(c.client_id) ?? 0) + 1);
  }

  const { data: saved } = await supabase
    .from("saved_photographers")
    .select("user_id")
    .in("user_id", userIds.length > 0 ? userIds : [""]);
  const savedCounts = new Map<string, number>();
  for (const s of saved ?? []) {
    savedCounts.set(s.user_id, (savedCounts.get(s.user_id) ?? 0) + 1);
  }

  const total = rows.length;
  const start = (page - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">All Users — {total}</h1>

      <AdminSearchBox placeholder="Search by name..." />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Conversations</th>
              <th className="p-3">Saved</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-3">{p.full_name ?? "—"}</td>
                <td className="p-3">{emailById.get(p.id) ?? "—"}</td>
                <td className="p-3">
                  {new Date(p.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="p-3">{conversationCounts.get(p.id) ?? 0}</td>
                <td className="p-3">{savedCounts.get(p.id) ?? 0}</td>
                <td className="p-3">
                  <SuspendUserButton userId={p.id} isSuspended={p.is_suspended} />
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/users?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`}
              className={p === page ? "font-semibold" : "text-muted-foreground hover:underline"}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
