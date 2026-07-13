"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Specialty } from "@/lib/types/database";

export const MAX_PHOTOS = 30;
export const MAX_VIDEOS = 5;
export const TOTAL_STEPS = 5;

export type PortfolioDraftItem = {
  localId: string;
  file: File;
  previewUrl: string;
  type: "photo" | "video";
};

export type OnboardingData = {
  fullName: string;
  avatarFile: File | null;
  avatarPreviewUrl: string | null;
  bio: string;
  serviceArea: string;
  primarySpecialty: string;
  secondarySpecialty1: string;
  secondarySpecialty2: string;
  priceMin: string;
  priceMax: string;
  availableThisMonth: boolean;
  portfolioItems: PortfolioDraftItem[];
  instagramUrl: string;
  websiteUrl: string;
  otherLinkUrl: string;
  otherLinkLabel: string;
  publicEmail: string;
  publicPhone: string;
};

type OnboardingContextValue = {
  step: number;
  setStep: (step: number) => void;
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  specialties: Specialty[];
  userId: string;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
  userId,
  specialties,
  initialFullName,
  initialAvatarUrl,
}: {
  children: React.ReactNode;
  userId: string;
  specialties: Specialty[];
  initialFullName: string;
  initialAvatarUrl: string | null;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    fullName: initialFullName,
    avatarFile: null,
    avatarPreviewUrl: initialAvatarUrl,
    bio: "",
    serviceArea: "",
    primarySpecialty: "",
    secondarySpecialty1: "",
    secondarySpecialty2: "",
    priceMin: "",
    priceMax: "",
    availableThisMonth: true,
    portfolioItems: [],
    instagramUrl: "",
    websiteUrl: "",
    otherLinkUrl: "",
    otherLinkLabel: "",
    publicEmail: "",
    publicPhone: "",
  });

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  const value = useMemo(
    () => ({ step, setStep, data, update, specialties, userId }),
    [step, data, specialties, userId],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
