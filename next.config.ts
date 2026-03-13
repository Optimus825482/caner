import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ["@prisma/client", "sharp", "onnxruntime-node"],
  async headers() {
    return [
      {
        source: "/uploads/products/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    localPatterns: [{ pathname: "/uploads/**" }],
    remotePatterns: [],
  },
};

export default withNextIntl(nextConfig);
