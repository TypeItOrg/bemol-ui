import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: { serverFunctions: false },
  images: {
    qualities: [75, 90],
  },
  output: "standalone",
  // Expose RSC headers so the proxy can fall back to browser navigation after action redirects.
  skipProxyUrlNormalize: true,
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  async headers() {
    return [
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
