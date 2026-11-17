import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

// Staff pages and form steps stay out of search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/sign-in",
        "/forgot-password",
        "/library/request/",
        "/events/registered",
        "/events/booking",
        "/learn/my-learning",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
