"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NAV_HISTORY_BASELINE_KEY } from "@/lib/nav-history";

export function BackButton() {
  const router = useRouter();

  function handleClick() {
    // window.history.length alone isn't reliable here — a freshly opened
    // tab often already reports 2 (its blank initial state plus the page it
    // navigated to), which would make router.back() land on a blank page
    // instead of falling back gracefully. Compare against the baseline
    // recorded when this tab session started instead: if history has grown
    // past that, the user really did navigate here from elsewhere in the
    // app.
    const baseline = Number(sessionStorage.getItem(NAV_HISTORY_BASELINE_KEY) ?? 0);
    if (window.history.length > baseline) {
      router.back();
    } else {
      router.push("/search");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center"
      style={{ gap: "4px", fontSize: "12px", color: "#7A7572", marginBottom: "12px" }}
    >
      <ArrowLeft size={14} />
      Back
    </button>
  );
}
