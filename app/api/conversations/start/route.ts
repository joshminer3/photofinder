import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UNIQUE_VIOLATION = "23505";

export async function POST(request: Request) {
  const { photographerId } = await request.json();
  if (!photographerId) {
    return NextResponse.json({ error: "Missing photographerId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photographer } = await supabase
    .from("photographer_profiles")
    .select("id, user_id")
    .eq("id", photographerId)
    .single();

  if (!photographer) {
    return NextResponse.json({ error: "Photographer not found" }, { status: 404 });
  }

  if (photographer.user_id === user.id) {
    return NextResponse.json(
      { error: "Cannot message your own profile" },
      { status: 400 },
    );
  }

  // Check for an existing conversation first so a returning client doesn't
  // get a duplicate thread every time they click "Send a message".
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("client_id", user.id)
    .eq("photographer_id", photographerId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("conversations")
    .insert({ client_id: user.id, photographer_id: photographerId })
    .select("id")
    .single();

  if (!insertError) {
    return NextResponse.json({ conversationId: inserted.id });
  }

  if (insertError.code !== UNIQUE_VIOLATION) {
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }

  // Defensive fallback: two concurrent requests can both pass the check
  // above before either insert commits. The unique constraint on
  // (client_id, photographer_id) catches that race here.
  const { data: raceWinner, error: fetchError } = await supabase
    .from("conversations")
    .select("id")
    .eq("client_id", user.id)
    .eq("photographer_id", photographerId)
    .single();

  if (fetchError || !raceWinner) {
    return NextResponse.json({ error: "Failed to start conversation" }, { status: 500 });
  }

  return NextResponse.json({ conversationId: raceWinner.id });
}
