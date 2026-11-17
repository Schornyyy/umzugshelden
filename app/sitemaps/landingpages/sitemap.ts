import { generationSiteUrl } from "@/lib/generationPagePolicy";
import { seoLandingPagePath } from "@/lib/seoLandingPages";
import { listPublishedSeoLandingPageRecords } from "@/lib/seoLandingPageServer";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await listPublishedSeoLandingPageRecords();
  return pages.map((page) => ({
    url: `${generationSiteUrl()}${seoLandingPagePath(page.keywordSlug, page.citySlug)}`,
    lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
}
