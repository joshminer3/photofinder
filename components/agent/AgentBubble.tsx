"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { AgentPanel } from "./AgentPanel";

const LABEL_SHOW_DELAY_MS = 2000;
const LABEL_VISIBLE_DURATION_MS = 10000;

function AgentLabel() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), LABEL_SHOW_DELAY_MS);
    const hideTimer = setTimeout(
      () => setVisible(false),
      LABEL_SHOW_DELAY_MS + LABEL_VISIBLE_DURATION_MS,
    );
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed rounded-full whitespace-nowrap"
      style={{
        bottom: "84px",
        right: "24px",
        background: "#111010",
        color: "#FDFCFB",
        fontSize: "12px",
        fontWeight: 500,
        padding: "8px 14px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        zIndex: 50,
      }}
    >
      Use AI to find your photographer
    </div>
  );
}

export function AgentBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Only useful where a photographer search actually makes sense — home,
  // search results, and an individual profile.
  const isAllowedRoute =
    pathname === "/" || pathname === "/search" || pathname.startsWith("/photographer/");

  if (!isAllowedRoute) return null;

  return (
    <>
      {/* Keyed by pathname so the 2s-show/10s-hide cycle restarts on navigation. */}
      {!open && <AgentLabel key={pathname} />}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Find your photographer"
        title="Let me help you find your photographer"
        className="fixed flex items-center justify-center rounded-full border-none transition-transform hover:scale-105"
        style={{
          bottom: "24px",
          right: "24px",
          width: "52px",
          height: "52px",
          background: "#111010",
          color: "#FDFCFB",
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
          zIndex: 50,
        }}
      >
        <LogoMark className="size-[22px]" />
      </button>

      {open && <AgentPanel onClose={() => setOpen(false)} />}
    </>
  );
}
