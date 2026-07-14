import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { approvePhotographer } from "@/lib/admin/approve-photographer";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { photographerId } = await request.json();
  if (!photographerId) {
    return NextResponse.json({ error: "Missing photographerId" }, { status: 400 });
  }

  const result = await approvePhotographer(photographerId);
  if (result.status === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
