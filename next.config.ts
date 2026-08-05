import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/All-money-back-my-home",
  assetPrefix: "/All-money-back-my-home/",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
