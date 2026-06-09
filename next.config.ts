// next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from external domains used in tour listings
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // Required for Prisma on the server
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;