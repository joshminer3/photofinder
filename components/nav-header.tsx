import Link from "next/link";
import { MessageCircle, Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { LogoMark } from "@/components/logo-mark";

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
    <header
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{
        backgroundColor: "color-mix(in oklab, var(--brand-bg-page) 95%, transparent)",
        borderColor: "var(--brand-border)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold -tracking-[0.5px]"
          style={{ color: "var(--brand-text-primary)" }}
        >
          <LogoMark className="size-6" />
          Foto
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/messages"
            aria-label="Messages"
            className="rounded-full p-2 hover:bg-black/5"
            style={{ color: "var(--brand-text-muted)" }}
          >
            <MessageCircle className="size-5" />
          </Link>
          <Link
            href="/saved"
            aria-label="Saved photographers"
            className="rounded-full p-2 hover:bg-black/5"
            style={{ color: "var(--brand-text-muted)" }}
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
                className="hover:bg-black/5"
                style={{ color: "var(--brand-text-primary)" }}
              >
                Log in
              </Button>
              <Button
                render={<Link href="/signup" />}
                nativeButton={false}
                className="rounded-[6px] border-none hover:opacity-90"
                style={{
                  backgroundColor: "var(--brand-text-primary)",
                  color: "var(--brand-bg-page)",
                }}
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
