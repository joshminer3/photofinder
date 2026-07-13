import Link from "next/link";
import { Camera, MessageCircle, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";

export async function NavHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName: string | null = null;
  let photographerHref: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_photographer")
      .eq("id", user.id)
      .single();
    fullName = profile?.full_name ?? null;

    if (profile?.is_photographer) {
      const { data: photographerProfile } = await supabase
        .from("photographer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      photographerHref = photographerProfile ? "/dashboard/profile" : "/onboarding";
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Camera className="size-5" />
          Foto
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/messages"
            aria-label="Messages"
            className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <MessageCircle className="size-5" />
          </Link>
          <Link
            href="/saved"
            aria-label="Saved photographers"
            className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Bookmark className="size-5" />
          </Link>

          {user ? (
            <UserMenu
              fullName={fullName}
              email={user.email ?? ""}
              photographerHref={photographerHref}
            />
          ) : (
            <div className="flex items-center gap-2 pl-2">
              <Button
                variant="ghost"
                render={<Link href="/login" />}
                nativeButton={false}
              >
                Log in
              </Button>
              <Button render={<Link href="/signup" />} nativeButton={false}>
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
