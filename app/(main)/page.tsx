import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Find your photographer.
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Foto connects clients in Utah with photographers by specialty,
        location, price, and availability. Search is coming soon — for now,
        photographers can create their public profile.
      </p>
      <div className="flex gap-3">
        <Button render={<Link href="/signup" />} nativeButton={false} size="lg">
          Get started
        </Button>
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          size="lg"
          variant="outline"
        >
          Log in
        </Button>
      </div>
    </div>
  );
}
