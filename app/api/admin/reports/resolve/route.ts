import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { suspendPhotographer } from "@/lib/admin/suspend-photographer";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { reportId, action } = await request.json();
  if (!reportId || (action !== "dismiss" && action !== "suspend")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: report } = await supabase
    .from("reports")
    .select("id, photographer_id")
    .eq("id", reportId)
    .single();

  if (!report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "suspend") {
    await suspendPhotographer(report.photographer_id);
  }

  const { error } = await supabase
    .from("reports")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) {
    return NextResponse.json({ error: "Failed to resolve report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
