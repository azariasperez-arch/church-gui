import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@church-screen/core"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
