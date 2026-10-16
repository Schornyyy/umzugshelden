import "server-only";

import { cache } from "react";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { BlogPage } from "@/types/blog/BlogPage";
import type {
  AdminBlogMainCategory,
  BlogSubcategory,
} from "@/types/blog/BlogSubcategory";
import { slugify } from "@/utils/slugify";

const BLOG_COLLECTION = "blogPages_umzugshelden";
const SUBCATEGORY_COLLECTION = "blogSubcategories_umzugshelden";

function normalizePath(value: string): string {
  return value
    .split("/")
    .map((part) => slugify(part.trim().toLocaleLowerCase("de")))
    .filter(Boolean)
    .join("/");
}

function storedPath(page: Partial<BlogPage>): string {
  if (page.path) return normalizePath(page.path);
  return normalizePath(
    `${page.mainCategory || ""}/${page.subcategorySlug || ""}/${page.slug || ""}`,
  );
}

const loadBlogPages = cache(async (): Promise<BlogPage[]> => {
  const snapshot = await getAdminDatabase().collection(BLOG_COLLECTION).get();
  return snapshot.docs.map((document) => {
    const data = document.data() as Omit<BlogPage, "id">;
    return {
      ...data,
      id: document.id,
      path: storedPath(data),
      parentId: data.parentId || null,
      keywords: data.keywords || [],
      sections: data.sections || [],
      faq: data.faq || [],
      visible: data.visible ?? false,
    };
  });
});

const loadBlogSubcategories = cache(async (): Promise<BlogSubcategory[]> => {
  const snapshot = await getAdminDatabase()
    .collection(SUBCATEGORY_COLLECTION)
    .get();
  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      name: String(data.name || ""),
      slug: String(data.slug || ""),
      mainCategory: data.mainCategory as AdminBlogMainCategory,
      thumbnailUrl:
        typeof data.thumbnailUrl === "string" && data.thumbnailUrl
          ? data.thumbnailUrl
          : undefined,
      createdAt: Number(data.createdAt || 0),
      updatedAt: Number(data.updatedAt || 0),
    };
  });
});

export async function listPublicBlogPages(): Promise<BlogPage[]> {
  return (await loadBlogPages())
    .filter((page) => page.visible)
    .sort((left, right) => right.createdAt - left.createdAt);
}

export async function getPublicBlogPageByPath(
  path: string,
): Promise<BlogPage | null> {
  const normalized = normalizePath(path);
  return (
    (await loadBlogPages()).find(
      (page) => page.visible && storedPath(page) === normalized,
    ) || null
  );
}

export async function listPublicBlogPagesBySubcategory(
  subcategorySlug: string,
  mainCategory: AdminBlogMainCategory,
): Promise<BlogPage[]> {
  return (await listPublicBlogPages()).filter(
    (page) =>
      page.subcategorySlug === subcategorySlug &&
      page.mainCategory === mainCategory,
  );
}

export async function listPublicBlogSubcategories(): Promise<
  BlogSubcategory[]
> {
  return loadBlogSubcategories();
}

export async function getPublicBlogSubcategory(
  slug: string,
  mainCategory: AdminBlogMainCategory,
): Promise<BlogSubcategory | null> {
  return (
    (await loadBlogSubcategories()).find(
      (subcategory) =>
        subcategory.slug === slug &&
        subcategory.mainCategory === mainCategory,
    ) || null
  );
}
