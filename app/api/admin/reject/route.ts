import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { rejectPhotographer } from "@/lib/admin/reject-photographer";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { photographerId, reason } = await request.json();
  if (!photographerId) {
    return NextResponse.json({ error: "Missing photographerId" }, { status: 400 });
  }

  const result = await rejectPhotographer(
    photographerId,
    typeof reason === "string" && reason.trim() ? reason.trim() : null,
  );
  if (result.status === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
