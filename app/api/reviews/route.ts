import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { photographerId, rating, content } = await request.json();

  if (
    !photographerId ||
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 5 ||
    typeof content !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const trimmed = content.trim();
  if (trimmed.length < 20 || trimmed.length > 1000) {
    return NextResponse.json(
      { error: "Review must be between 20 and 1000 characters" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in to leave a review" }, { status: 401 });
  }

  const { data: photographer } = await supabase
    .from("photographer_profiles")
    .select("user_id")
    .eq("id", photographerId)
    .single();

  if (!photographer) {
    return NextResponse.json({ error: "Photographer not found" }, { status: 404 });
  }

  if (photographer.user_id === user.id) {
    return NextResponse.json(
      { error: "You cannot review your own profile" },
      { status: 400 },
    );
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .upsert(
      {
        photographer_id: photographerId,
        reviewer_id: user.id,
        rating,
        content: trimmed,
      },
      { onConflict: "photographer_id,reviewer_id" },
    )
    .select("*")
    .single();

  if (error || !review) {
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }

  return NextResponse.json({ review });
}
