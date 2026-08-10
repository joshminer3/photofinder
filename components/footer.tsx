"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // The messages page is a fixed-height chat screen (height: calc(100vh -
  // 4rem); overflow: hidden) — a footer below it would push the layout past
  // 100vh and force a page scroll, breaking that fixed-screen feel.
  if (pathname.startsWith("/messages")) return null;

  return (
    <footer style={{ borderTop: "0.5px solid #EEEAE4", background: "#FDFCFB" }}>
      <div className="mx-auto max-w-6xl" style={{ padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#7A7572" }}>
          Contact us at{" "}
          <a href="mailto:fotodog.support@gmail.com" style={{ color: "#111010", fontWeight: 500 }}>
            fotodog.support@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}
