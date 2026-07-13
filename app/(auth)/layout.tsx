import Link from "next/link";
import { Camera } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        <Camera className="size-5" />
        Foto
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
