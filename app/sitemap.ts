import type { MetadataRoute } from "next";
import { KENNISBANK_PAGES } from "@/content/kennisbank";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dbakompas.nl";
  const lastModified = new Date("2026-05-22");

  return [
    { url: baseUrl, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/over-dba-kompas`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/voor/publieke-sector`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/voor/private-sector`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/kennisbank`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    ...KENNISBANK_PAGES.map((page) => ({
      url: `${baseUrl}/kennisbank/${page.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
