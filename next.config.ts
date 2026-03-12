import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ["@prisma/client"],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [],
  },
};

export default withNextIntl(nextConfig);
