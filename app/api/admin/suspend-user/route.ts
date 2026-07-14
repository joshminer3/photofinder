import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_suspended: true })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: "Failed to suspend account" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
