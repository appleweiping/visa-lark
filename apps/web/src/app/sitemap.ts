import type { MetadataRoute } from "next";

const BASE = "https://visalark.example.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/docs`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
