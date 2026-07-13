"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  fullName,
  email,
  photographerHref,
}: {
  fullName: string | null;
  email: string;
  photographerHref: string | null;
}) {
  const router = useRouter();
  const initials = (fullName ?? email).slice(0, 1).toUpperCase();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar className="size-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled className="flex flex-col items-start gap-0">
          <span className="text-sm font-medium">{fullName ?? "Account"}</span>
          <span className="text-xs text-muted-foreground">{email}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {photographerHref && (
          <DropdownMenuItem render={<a href={photographerHref} />}>
            <User className="size-4" />
            Photographer profile
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
