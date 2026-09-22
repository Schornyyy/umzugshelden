import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/crm/**/*": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
