import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
  ],
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
