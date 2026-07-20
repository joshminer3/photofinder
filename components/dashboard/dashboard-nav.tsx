"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPen,
  BarChart3,
  CreditCard,
  Star,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Edit profile", href: "/dashboard/profile", icon: UserPen },
  { label: "Analytics", href: null, icon: BarChart3 },
  { label: "Billing", href: null, icon: CreditCard },
  { label: "Reviews", href: null, icon: Star },
] as const;

export function DashboardNav({
  photographerName,
  specialty,
  slug,
}: {
  photographerName: string;
  specialty: string;
  slug: string;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden shrink-0 md:flex md:w-[200px] md:flex-col"
        style={{ background: "#FDFCFB", borderRight: "0.5px solid #EEEAE4", padding: "16px 12px" }}
      >
        <div style={{ padding: "8px 10px", marginBottom: "12px" }}>
          <p style={{ fontSize: "12px", fontWeight: 500, color: "#111010" }}>{photographerName}</p>
          <p style={{ fontSize: "11px", color: "#7A7572", marginTop: "1px" }}>{specialty}</p>
        </div>

        <div style={{ height: "0.5px", background: "#EEEAE4", marginBottom: "10px" }} />

        {NAV_ITEMS.map((item) => (
          <NavItem key={item.label} item={item} active={pathname === item.href} />
        ))}

        <div style={{ height: "0.5px", background: "#EEEAE4", margin: "10px 0" }} />

        <a
          href={`/photographer/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center hover:!text-[#111010]"
          style={{ gap: "5px", fontSize: "12px", color: "#7A7572", padding: "8px 10px" }}
        >
          <ExternalLink size={13} />
          View my profile
        </a>
      </aside>

      {/* Mobile tab bar */}
      <div
        className="flex overflow-x-auto md:hidden"
        style={{ background: "#FFFFFF", borderBottom: "0.5px solid #EEEAE4" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const isDisabled = !item.href;
          const content = (
            <span
              className="flex shrink-0 items-center"
              style={{
                gap: "6px",
                fontSize: "12px",
                padding: "10px 14px",
                color: isDisabled ? "#B8B3AE" : isActive ? "#111010" : "#7A7572",
                fontWeight: isActive ? 500 : 400,
                borderBottom: isActive ? "2px solid #111010" : "2px solid transparent",
              }}
            >
              <item.icon size={13} />
              {item.label}
            </span>
          );
          return item.href ? (
            <Link key={item.label} href={item.href}>
              {content}
            </Link>
          ) : (
            <span key={item.label} className="cursor-default">
              {content}
            </span>
          );
        })}
      </div>
    </>
  );
}

function NavItem({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const isDisabled = !item.href;

  const content = (
    <span
      className={cn("flex items-center", !isDisabled && !active && "hover:bg-[#F5F2EE]")}
      style={{
        gap: "6px",
        padding: "8px 10px",
        borderRadius: "6px",
        marginBottom: "2px",
        fontSize: "13px",
        background: active ? "#F0EFED" : "transparent",
        color: isDisabled ? "#B8B3AE" : active ? "#111010" : "#4C4845",
        fontWeight: active ? 500 : 400,
        cursor: isDisabled ? "default" : "pointer",
      }}
    >
      <item.icon size={13} />
      {item.label}
    </span>
  );

  if (isDisabled) {
    return content;
  }

  return <Link href={item.href}>{content}</Link>;
}
