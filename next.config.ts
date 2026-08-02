import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Catch unsafe lifecycle patterns and double-render effects in development.
  reactStrictMode: true,

  // Compile-time safety for <Link>/router paths: a typo in a route becomes a
  // TypeScript error instead of a runtime 404 (Document 04 — deep linking).
  typedRoutes: true,

  images: {
    // POC serves only local assets (bank logos, illustrations). Remote sources
    // must be allow-listed here explicitly when they are introduced.
    remotePatterns: [],
  },
};

export default nextConfig;
