export type PhotographerContextInput = {
  id: string;
  name: string;
  bio: string | null;
  primarySpecialty: string;
  secondarySpecialty1: string | null;
  secondarySpecialty2: string | null;
  serviceArea: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  availableThisMonth: boolean;
  avgRating: number | null;
  reviewCount: number;
};

export function buildPhotographerContext(photographers: PhotographerContextInput[]): string {
  if (photographers.length === 0) return "No photographers are currently listed.";

  return photographers
    .map((p) => {
      const specialties = [p.primarySpecialty, p.secondarySpecialty1, p.secondarySpecialty2]
        .filter((s): s is string => Boolean(s))
        .join(", ");
      const price =
        p.priceRangeMin && p.priceRangeMax
          ? `$${p.priceRangeMin}–$${p.priceRangeMax}`
          : p.priceRangeMin
            ? `From $${p.priceRangeMin}`
            : "Price not listed";
      const rating =
        p.reviewCount > 0 && p.avgRating != null
          ? `${p.avgRating.toFixed(1)} stars (${p.reviewCount} review${p.reviewCount === 1 ? "" : "s"})`
          : "No reviews yet";
      const available = p.availableThisMonth ? "Available this month" : "Availability not confirmed";

      return `ID: ${p.id}
Name: ${p.name}
Specialties: ${specialties}
Location: ${p.serviceArea ?? "Utah"}
Price: ${price}
Availability: ${available}
Rating: ${rating}
Bio: ${p.bio ?? "No bio provided"}`;
    })
    .join("\n\n---\n\n");
}

export function buildSystemPrompt(photographerContext: string): string {
  return `You are a friendly photographer matching assistant for Foto, a photography marketplace in Utah. Your job is to help clients find the perfect photographer for their needs.

You will receive a description of what the client is looking for, and optionally some inspiration photos showing the style they want. Use both the text description and the visual style in the photos to make your matches.

Here are all the photographers currently available on Foto:

${photographerContext}

Based on the client's request, select the 3 best matching photographers (or up to 5 if there are strong matches). Consider:
- Photography specialty match (wedding, family, sports, etc.)
- Style match (if inspiration photos are provided, describe what style you see and match it to photographer bios)
- Location/service area
- Price range if mentioned
- Availability if they mentioned specific dates

Respond ONLY with a valid JSON object in this exact format — no preamble, no markdown fences:
{
  "intro": "A warm 1-2 sentence intro explaining your top matches and what you noticed about what they're looking for",
  "matches": [
    {
      "photographer_id": "the exact UUID from the photographer list above",
      "explanation": "1-2 sentences explaining specifically why this photographer is a great fit for this client"
    }
  ]
}

The photographer_id must exactly match one of the IDs listed above. If there are fewer than 3 good matches, return only the ones that genuinely fit — don't force matches. If no photographers match at all, return an empty matches array and explain why in the intro.`;
}
