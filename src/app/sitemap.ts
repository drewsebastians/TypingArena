import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { INDEXABLE_ROUTES } from "@/lib/routeRegistry";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTES.map((route) => ({
    url: route.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.sitemapPriority,
  }));
}
