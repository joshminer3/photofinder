"use client";

import { useRouter } from "next/navigation";

export function QuickActionCard({
  icon,
  title,
  subtitle,
  buttonText,
  filled,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  buttonText: string;
  filled: boolean;
  href: string;
}) {
  const router = useRouter();
  return (
    <div
      className="flex items-center justify-between"
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E6E2DD",
        borderRadius: "8px",
        padding: "14px",
      }}
    >
      <div className="flex items-center" style={{ gap: "12px" }}>
        <div
          className="flex shrink-0 items-center justify-center"
          style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#F0EFED" }}
        >
          {icon}
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#111010", marginBottom: "2px" }}>
            {title}
          </p>
          <p style={{ fontSize: "11px", color: "#7A7572" }}>{subtitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push(href)}
        className="flex shrink-0 items-center rounded-[5px]"
        style={{
          height: "28px",
          fontSize: "11px",
          fontWeight: 500,
          padding: "0 12px",
          background: filled ? "#111010" : "transparent",
          color: filled ? "#FDFCFB" : "#111010",
          border: filled ? "none" : "0.5px solid #E6E2DD",
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}
