"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-time";
import type { ConversationSummary } from "@/lib/messages/get-conversations";

export function MessagesShell({
  conversations,
  children,
}: {
  conversations: ConversationSummary[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeId = pathname.startsWith("/messages/")
    ? pathname.split("/messages/")[1]
    : null;
  const hasActiveThread = Boolean(activeId);

  return (
    <div style={{ background: "#FDFCFB", height: "calc(100vh - 4rem)", overflow: "hidden" }}>
      <div
        className="mx-auto flex h-full max-w-5xl"
        style={{ border: "0.5px solid #DAD4CC", background: "#FFFFFF" }}
      >
        <div
          className={cn("flex w-full shrink-0 flex-col sm:w-[280px]", hasActiveThread && "hidden sm:flex")}
          style={{ background: "#FDFCFB", borderRight: "0.5px solid #DAD4CC" }}
        >
          <div
            className="flex shrink-0 items-center justify-between"
            style={{ height: "48px", padding: "0 16px", borderBottom: "0.5px solid #DAD4CC" }}
          >
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#111010", letterSpacing: "-0.3px" }}>
              Messages
            </span>
            <span style={{ fontSize: "11px", color: "#7A7572" }}>
              {conversations.length} conversation{conversations.length === 1 ? "" : "s"}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center" style={{ padding: "32px" }}>
                <p style={{ fontSize: "13px", color: "#7A7572" }}>No messages yet.</p>
                <p style={{ fontSize: "11px", color: "#B8B3AE", marginTop: "4px" }}>
                  Find a photographer and send them a message.
                </p>
              </div>
            ) : (
              <ul>
                {conversations.map((c) => {
                  const isActive = activeId === c.id;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/messages/${c.id}`}
                        className="flex items-center hover:bg-[#F5F2EE]"
                        style={{
                          padding: "12px 14px",
                          gap: "10px",
                          borderBottom: "0.5px solid #DAD4CC",
                          borderLeft: isActive ? "2.5px solid #111010" : "2.5px solid transparent",
                        }}
                      >
                        <div className="relative shrink-0" style={{ width: "40px", height: "40px" }}>
                          {c.otherAvatarUrl ? (
                            <Image
                              src={c.otherAvatarUrl}
                              alt=""
                              fill
                              sizes="40px"
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="flex size-full items-center justify-center rounded-full"
                              style={{ background: "#E6E2DD", color: "#7A7572", fontSize: "14px", fontWeight: 500 }}
                            >
                              {c.otherName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          {c.hasUnread && (
                            <span
                              className="absolute rounded-full"
                              style={{
                                top: "-2px",
                                right: "-2px",
                                width: "10px",
                                height: "10px",
                                background: "#111010",
                                border: "2px solid #FDFCFB",
                              }}
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div
                            className="flex items-baseline justify-between"
                            style={{ gap: "8px", marginBottom: "3px" }}
                          >
                            <span
                              className="truncate"
                              style={{ fontSize: "13px", fontWeight: 500, color: "#111010" }}
                            >
                              {c.otherName}
                            </span>
                            <span className="shrink-0" style={{ fontSize: "10px", color: "#B8B3AE" }}>
                              {formatRelativeTime(c.lastMessageAt)}
                            </span>
                          </div>
                          <p
                            className="truncate"
                            style={{
                              fontSize: "11px",
                              fontWeight: c.hasUnread ? 500 : 400,
                              color: c.hasUnread ? "#111010" : "#7A7572",
                            }}
                          >
                            {c.lastMessage ?? "No messages yet"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div
          className={cn("flex min-w-0 flex-1 flex-col", !hasActiveThread && "hidden sm:flex")}
          style={{ background: "#FFFFFF" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
