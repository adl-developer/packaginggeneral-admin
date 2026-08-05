import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Eight catalogue images at up to 5 MB each.
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.packaginggeneral.com",
        pathname: "/**",
      },
    ],
  },
  /* Sentry is intentionally NOT wired here yet — the storefront's config uses a
     separate Sentry project. Add withSentryConfig once an admin project exists. */
};

export default nextConfig;
