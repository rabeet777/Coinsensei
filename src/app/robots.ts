import type { MetadataRoute } from "next";

const BASE_URL = "https://coinsensei.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Per-code referral landing pages carry no unique content to index.
      disallow: "/r/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
