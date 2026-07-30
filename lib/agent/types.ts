export type MatchedPhotographer = {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  primarySpecialty: string;
  serviceArea: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  availableThisMonth: boolean;
  coverImageUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  explanation: string;
};

export type AgentMatchResponse = {
  intro: string;
  matches: MatchedPhotographer[];
};
