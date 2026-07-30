"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { AgentPanel } from "./AgentPanel";

export function AgentBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // The messages page has its own input pinned to the bottom of the screen —
  // the bubble would sit on top of it, so hide the agent there.
  if (pathname.startsWith("/messages")) return null;

  return (
    <>
      {!open && (
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
      )}

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
