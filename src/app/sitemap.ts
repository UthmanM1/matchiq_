import { MetadataRoute } from "next";
import { DEMO_VENDORS } from "@/lib/demo-data/vendors";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://matchiq.example";
  const staticRoutes = ["", "/vendors", "/login", "/signup"].map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));
  const vendorRoutes = DEMO_VENDORS.map((v) => ({ url: `${base}/vendors/${v.id}`, lastModified: new Date(v.updatedAt) }));
  return [...staticRoutes, ...vendorRoutes];
}
