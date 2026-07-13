import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js defaults to "attachment", which makes Chrome refuse to render
    // the image inline (forces a download instead). Safe to relax here
    // because the portfolios bucket restricts uploads to actual image/video
    // MIME types (see supabase/migrations/002_restrict_portfolio_bucket_mime_types.sql).
    contentDispositionType: "inline",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
