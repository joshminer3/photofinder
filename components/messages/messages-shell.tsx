"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-time";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ConversationSummary } from "@/lib/messages/get-conversations";

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

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
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl">
      <div
        className={cn(
          "w-full shrink-0 overflow-y-auto border-r sm:w-80",
          hasActiveThread && "hidden sm:block",
        )}
      >
        {conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-muted-foreground">
              No messages yet.
              <br />
              Find a photographer you love and send them a message.
            </p>
            <Button render={<Link href="/search" />} nativeButton={false}>
              Browse Photographers
            </Button>
          </div>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className={cn(
                    "flex items-center gap-3 border-b p-4 hover:bg-accent",
                    activeId === c.id && "bg-accent",
                  )}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={c.otherAvatarUrl ?? undefined} />
                    <AvatarFallback>
                      {c.otherName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{c.otherName}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-muted-foreground">
                        {c.lastMessage ? truncate(c.lastMessage, 60) : "No messages yet"}
                      </p>
                      {c.hasUnread && (
                        <span className="size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cn("flex-1", !hasActiveThread && "hidden sm:flex")}>
        {children}
      </div>
    </div>
  );
}
