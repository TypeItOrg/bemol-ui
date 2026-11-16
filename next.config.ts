import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: { serverFunctions: false },
  images: {
    qualities: [75, 90],
    // Matches the public asset TTL so a replaced file updates on both paths.
    minimumCacheTTL: 86_400,
  },
  output: "standalone",
  // Expose RSC headers so the proxy can fall back to browser navigation after action redirects.
  skipProxyUrlNormalize: true,
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  async headers() {
    return [
      {
        source: "/:dir(images|brand|fonts)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/maintenance.html",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
