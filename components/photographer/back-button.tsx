"use client";

import { ArrowLeft } from "lucide-react";
import { useSmartBack } from "@/lib/hooks/use-smart-back";

export function BackButton() {
  const goBack = useSmartBack("/search");

  return (
    <button
      type="button"
      onClick={goBack}
      className="flex items-center"
      style={{ gap: "4px", fontSize: "12px", color: "#7A7572", marginBottom: "12px" }}
    >
      <ArrowLeft size={14} />
      Back
    </button>
  );
}
