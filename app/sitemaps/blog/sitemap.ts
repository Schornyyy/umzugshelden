
import { listBlogSubcategories } from "@/actions/blogSubcategoryActions";
import { listBlogPagesBySubcategory } from "@/actions/blogPageActions";
import type { MetadataRoute } from "next";

// If domain changes, adjust here or move to config
const BASE_URL = "https://www.landschaftshelden.io";
const MAIN_CATEGORIES: { key: string; path: string }[] = [
  { key: "unternehmen", path: "/blog/unternehmen" },
  { key: "partner", path: "/blog/partner" },
  { key: "ratgeber", path: "/blog/ratgeber" },
  { key: "ereignisse", path: "/blog/ereignisse" },
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
  const allSubcategories = await listBlogSubcategories();
  for (const sub of allSubcategories) {
    entries.push({
      url: `${BASE_URL}/blog/${sub.mainCategory}/${sub.slug}`,
      lastModified: new Date(sub.updatedAt || sub.createdAt),
      priority: 0.6,
      changeFrequency: "daily",
    });
  }

  // Blog pages (filter only visible)
  for (const sub of allSubcategories) {
    const pages = await listBlogPagesBySubcategory(sub.slug);
    pages
      .filter((p) => p.visible)
      .forEach((p) => {
        entries.push({
          url: `${BASE_URL}/blog/${p.mainCategory}/${p.subcategorySlug}/${p.slug}`,
          lastModified: new Date(p.updatedAt || p.createdAt),
          priority: 0.8,
          changeFrequency: "weekly",
        });
      });
  }

  return entries;
}
