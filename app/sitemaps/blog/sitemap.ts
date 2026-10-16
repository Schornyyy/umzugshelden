
import {
  listPublicBlogPages,
  listPublicBlogSubcategories,
} from "@/lib/blogPublicData";
import type { MetadataRoute } from "next";

// If domain changes, adjust here or move to config
const BASE_URL = "https://www.umzugshelden.io";
const MAIN_CATEGORIES: { key: string; path: string }[] = [
  { key: "umzug", path: "/blog/umzug" },
  { key: "streicharbeit", path: "/blog/streicharbeit" },
  { key: "ratgeber", path: "/blog/ratgeber" },
  { key: "entrümpelung", path: "/blog/entrümpelung" },
];

export const dynamic = "force-dynamic"; // always latest content

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  const now = new Date();

  // Main category overview pages
  for (const cat of MAIN_CATEGORIES) {
    entries.push({
      url: BASE_URL + cat.path,
      lastModified: now,
      priority: 0.5,
      changeFrequency: "daily",
    });
  }

  // Subcategories
  const allSubcategories = await listPublicBlogSubcategories();
  for (const sub of allSubcategories) {
    entries.push({
      url: `${BASE_URL}/blog/${sub.mainCategory}/${sub.slug}`,
      lastModified: new Date(sub.updatedAt || sub.createdAt),
      priority: 0.6,
      changeFrequency: "daily",
    });
  }

  // Blog pages (filter only visible)
  const pages = await listPublicBlogPages();
  for (const page of pages) {
    entries.push({
      url: `${BASE_URL}/blog/${page.path || `${page.mainCategory}/${page.subcategorySlug}/${page.slug}`}`,
      lastModified: new Date(page.updatedAt || page.createdAt),
      priority: 0.8,
      changeFrequency: "weekly",
    });
  }

  return entries;
}
