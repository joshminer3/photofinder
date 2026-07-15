import Link from "next/link";

export function SwitchLine({
  prompt,
  linkText,
  href,
}: {
  prompt: string;
  linkText: string;
  href: string;
}) {
  return (
    <p style={{ fontSize: "13px", color: "#7A7572", textAlign: "center", marginTop: "14px" }}>
      {prompt}{" "}
      <Link
        href={href}
        style={{
          color: "#111010",
          fontWeight: 500,
          textDecoration: "none",
          borderBottom: "1px solid #111010",
        }}
      >
        {linkText}
      </Link>
    </p>
  );
}
