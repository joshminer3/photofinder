import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="flex min-h-screen flex-col items-center"
      style={{ background: "#FDFCFB", padding: "40px 24px 60px" }}
    >
      <Link
        href="/"
        className="flex items-center"
        style={{ color: "#111010", marginBottom: "28px" }}
      >
        <LogoMark className="size-[22px]" />
        <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.5px", marginLeft: "8px" }}>
          Foto
        </span>
      </Link>
      <div className="w-full" style={{ maxWidth: "420px" }}>
        {children}
      </div>
    </div>
  );
}
