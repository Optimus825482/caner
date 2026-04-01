import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/_next/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/uploads/", "/logo.png", "/image.png"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
