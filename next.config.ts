import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Sentry is intentionally NOT wired here yet — the storefront's config uses a
     separate Sentry project. Add withSentryConfig once an admin project exists. */
};

export default nextConfig;
