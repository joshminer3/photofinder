import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { photographerId, reason, details } = await request.json();

  if (!photographerId || typeof reason !== "string" || !reason.trim()) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("reports").insert({
    photographer_id: photographerId,
    reporter_id: user?.id ?? null,
    reason,
    details: typeof details === "string" && details.trim() ? details.trim() : null,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
