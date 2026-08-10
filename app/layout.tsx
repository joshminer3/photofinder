import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { AgentBubble } from "@/components/agent/AgentBubble";
import { navHistoryBaselineScript } from "@/lib/nav-history";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Required for the app/opengraph-image.png and app/twitter-image.png file
  // conventions to resolve to an absolute URL — without this, Next.js
  // defaults to http://localhost:3000, which breaks link previews in
  // production.
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Foto — Find your photographer",
  description:
    "Foto is a photographer discovery marketplace for Utah. Find and contact photographers filtered by specialty, location, price, and availability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="nav-history-baseline" strategy="beforeInteractive">
          {navHistoryBaselineScript}
        </Script>
        {children}
        <Toaster />
        <Analytics />
        <AgentBubble />
      </body>
    </html>
  );
}
