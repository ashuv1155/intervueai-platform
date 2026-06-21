import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup", "/terms", "/privacy", "/security"],
      disallow: ["/dashboard/", "/interview/", "/admin/"],
    },
    sitemap: "https://intervueai.com/sitemap.xml",
  };
}
