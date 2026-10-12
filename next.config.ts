import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  output: "standalone",
  // Expose RSC headers so the proxy can fall back to browser navigation after action redirects.
  skipProxyUrlNormalize: true,
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
