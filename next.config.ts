// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from external domains used in tour listings
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  // Required for Stripe webhook signature verification
  // The webhook route needs the raw body — handled via runtime = "nodejs"
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;