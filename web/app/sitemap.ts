import type { MetadataRoute } from "next";
import { getAllCafes } from "@/lib/cafes";

const BASE = "https://ngopi-tegal.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const cafes = getAllCafes().map((c) => ({
    url: `${BASE}/kafe/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...cafes,
  ];
}
