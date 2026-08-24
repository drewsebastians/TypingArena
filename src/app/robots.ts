import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/progress"], // private history non-indexable per blueprint §22.2
      },
    ],
    sitemap: "https://typingarena.example/sitemap.xml",
  };
}
