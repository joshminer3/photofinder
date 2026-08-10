import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
