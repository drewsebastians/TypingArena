import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/progress"], // private history is never indexed
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
