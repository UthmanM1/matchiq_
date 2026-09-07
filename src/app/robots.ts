import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/decisions", "/workspace", "/compare", "/reports", "/analytics", "/settings", "/admin", "/api"] }],
    sitemap: "https://matchiq.example/sitemap.xml",
  };
}
