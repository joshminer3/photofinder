import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getRatingsByPhotographerId } from "@/lib/reviews";
import { getCoverImagesByPhotographerId } from "@/lib/portfolio-covers";
import { buildPhotographerContext, buildSystemPrompt } from "@/lib/agent/prompts";
import {
  MAX_AGENT_PHOTOS,
  MAX_AGENT_PHOTO_SIZE_BYTES,
  isSupportedImageType,
} from "@/lib/agent/constants";
import type { MatchedPhotographer } from "@/lib/agent/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-5";

type ClaudeMatchResponse = {
  intro: string;
  matches: Array<{ photographer_id: string; explanation: string }>;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const message = (formData.get("message") as string | null) ?? "";
  const photoFiles = formData
    .getAll("photos")
    .filter((v): v is File => v instanceof File)
    .slice(0, MAX_AGENT_PHOTOS);

  if (!message.trim() && photoFiles.length === 0) {
    return NextResponse.json(
      { error: "Describe what you're looking for or upload a photo." },
      { status: 400 },
    );
  }

  for (const file of photoFiles) {
    if (!isSupportedImageType(file.type)) {
      return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
    }
    if (file.size > MAX_AGENT_PHOTO_SIZE_BYTES) {
      return NextResponse.json({ error: "Each photo must be under 5MB." }, { status: 400 });
    }
  }

  const supabase = await createClient();
  const { data: photographers } = await supabase
    .from("photographer_profiles")
    .select(
      "id, slug, bio, primary_specialty, secondary_specialty_1, secondary_specialty_2, service_area, price_range_min, price_range_max, available_this_month, profiles!inner(full_name, avatar_url, is_approved, is_photographer)",
    )
    .eq("profiles.is_approved", true)
    .eq("profiles.is_photographer", true);

  const photographerList = photographers ?? [];
  const photographerIds = photographerList.map((p) => p.id);

  const [ratings, covers] = await Promise.all([
    getRatingsByPhotographerId(photographerIds),
    getCoverImagesByPhotographerId(photographerIds),
  ]);

  const photographerContext = buildPhotographerContext(
    photographerList.map((p) => ({
      id: p.id,
      name: p.profiles?.full_name ?? "Unknown",
      bio: p.bio,
      primarySpecialty: p.primary_specialty,
      secondarySpecialty1: p.secondary_specialty_1,
      secondarySpecialty2: p.secondary_specialty_2,
      serviceArea: p.service_area,
      priceRangeMin: p.price_range_min,
      priceRangeMax: p.price_range_max,
      availableThisMonth: p.available_this_month,
      avgRating: ratings.get(p.id)?.avgRating ?? null,
      reviewCount: ratings.get(p.id)?.reviewCount ?? 0,
    })),
  );

  const userContent: Anthropic.ContentBlockParam[] = [];

  for (const file of photoFiles) {
    if (!isSupportedImageType(file.type)) continue; // already validated above
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    userContent.push({
      type: "image",
      source: { type: "base64", media_type: file.type, data: base64 },
    });
  }

  userContent.push({
    type: "text",
    text: `Here is what I'm looking for in a photographer:\n\n${
      message.trim() || "(No description provided — base the match on the uploaded photo(s) alone.)"
    }\n\n${
      photoFiles.length > 0
        ? `I've also uploaded ${photoFiles.length} inspiration photo(s) above to show the style I'm going for.`
        : ""
    }`,
  });

  let response;
  try {
    response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: buildSystemPrompt(photographerContext),
      messages: [{ role: "user", content: userContent }],
    });
  } catch (err) {
    console.error("Agent match error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  const responseText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  let parsed: ClaudeMatchResponse;
  try {
    const cleaned = responseText.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Failed to parse agent response" }, { status: 500 });
  }

  const matches: MatchedPhotographer[] = parsed.matches
    .map((match) => {
      const photographer = photographerList.find((p) => p.id === match.photographer_id);
      if (!photographer) return null;

      const rating = ratings.get(photographer.id);

      const enriched: MatchedPhotographer = {
        id: photographer.id,
        slug: photographer.slug,
        name: photographer.profiles?.full_name ?? "Photographer",
        avatarUrl: photographer.profiles?.avatar_url ?? null,
        primarySpecialty: photographer.primary_specialty,
        serviceArea: photographer.service_area,
        priceRangeMin: photographer.price_range_min,
        priceRangeMax: photographer.price_range_max,
        availableThisMonth: photographer.available_this_month,
        coverImageUrl: covers.get(photographer.id) ?? null,
        avgRating: rating?.avgRating ?? null,
        reviewCount: rating?.reviewCount ?? 0,
        explanation: match.explanation,
      };
      return enriched;
    })
    .filter((m): m is MatchedPhotographer => m !== null);

  return NextResponse.json({ intro: parsed.intro, matches });
}
