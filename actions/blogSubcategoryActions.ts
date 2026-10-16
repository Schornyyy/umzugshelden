"use server";

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { z } from "zod";
import { cacheManager } from "@/lib/cache";
import type { BlogSubcategory, AdminBlogMainCategory } from "@/types/blog/BlogSubcategory";
import { slugify } from "@/utils/slugify";
import { revalidatePath } from "next/cache";

const COLLECTION = "blogSubcategories_umzugshelden";

// Cache keys (extend existing CACHE_KEYS via prefix to avoid central modification for now)
function cacheKeyAll(main?: string) {
  return main ? `BLOG_SUBCATEGORIES_${main}` : `BLOG_SUBCATEGORIES_ALL`;
}

const createSchema = z.object({
  name: z.string().min(2, "Name zu kurz"),
  mainCategory: z.custom<AdminBlogMainCategory>(),
  thumbnailUrl: z.string().url().optional(),
});

export type CreateBlogSubcategoryInput = z.infer<typeof createSchema>;

function buildSlug(name: string) {
  return slugify(name.trim().toLowerCase());
}

function invalidateCaches(main?: string) {
  try {
    cacheManager.delete(cacheKeyAll());
    if (main) cacheManager.delete(cacheKeyAll(main));
  } catch {}
}

function revalidateBlogRoutes(slug?: string) {
  try {
    revalidatePath("/blog");
    if (slug) {
      revalidatePath(`/blog/${slug}`);
    }
  } catch {}
}

export async function createBlogSubcategory(input: CreateBlogSubcategoryInput): Promise<string> {
  const parsed = createSchema.parse(input);
  const slug = buildSlug(parsed.name);
  const col = getAdminDatabase().collection(COLLECTION);
  // Uniqueness per mainCategory
  const dupSnap = await col
    .where("mainCategory", "==", parsed.mainCategory)
    .where("slug", "==", slug)
    .get();
  if (!dupSnap.empty) throw new Error("Unterkategorie existiert bereits");

  const now = Date.now();
  const docRef = await col.add({
    name: parsed.name,
    slug,
    mainCategory: parsed.mainCategory,
    thumbnailUrl: parsed.thumbnailUrl || null,
    createdAt: now,
    updatedAt: now,
  });
  invalidateCaches(parsed.mainCategory);
  revalidateBlogRoutes(slug);
  return docRef.id;
}

export async function listBlogSubcategories(main?: AdminBlogMainCategory): Promise<BlogSubcategory[]> {
  const key = cacheKeyAll(main);
  const cached = cacheManager.get<BlogSubcategory[]>(key);
  if (cached) {
    // Ensure normalization even for cached payload (in case older cache stored null/empty string)
    return cached.map(c => ({
      ...c,
      thumbnailUrl: c.thumbnailUrl ? c.thumbnailUrl : undefined,
    }));
  }

  const col = getAdminDatabase().collection(COLLECTION);
  const snap = await (main ? col.where("mainCategory", "==", main) : col).get();
  const items: BlogSubcategory[] = snap.docs.map((d) => {
    const data = d.data() as Omit<BlogSubcategory, 'id'> & { slug: string; name: string } & Partial<BlogSubcategory>;
    return {
      id: d.id,
      name: data.name,
      slug: data.slug,
      mainCategory: data.mainCategory as AdminBlogMainCategory,
      // Normalize null / empty string to undefined so conditional rendering works
      thumbnailUrl: data.thumbnailUrl ? data.thumbnailUrl : undefined,
      createdAt: data.createdAt as number,
      updatedAt: data.updatedAt as number,
    };
  });
  cacheManager.set(key, items, { ttl: 5 * 60 * 1000 });
  return items;
}

export async function deleteBlogSubcategory(id: string): Promise<boolean> {
  const ref = getAdminDatabase().collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const data = snap.data() as { mainCategory?: AdminBlogMainCategory; slug?: string };
  await ref.delete();
  invalidateCaches(data.mainCategory);
  revalidateBlogRoutes(data.slug);
  return true;
}

export async function getBlogSubcategoryBySlug(
  slug: string,
  mainCategory?: AdminBlogMainCategory,
): Promise<BlogSubcategory | null> {
  const snap = await getAdminDatabase()
    .collection(COLLECTION)
    .where("slug", "==", slug)
    .get();
  if (snap.empty) return null;
  const d = mainCategory
    ? snap.docs.find(
        (document) => document.get("mainCategory") === mainCategory,
      )
    : snap.docs[0];
  if (!d) return null;
  const data = d.data() as {
    name: string;
    slug: string;
    mainCategory: AdminBlogMainCategory;
    thumbnailUrl?: string | null;
    createdAt: number;
    updatedAt: number;
  };
  return {
    id: d.id,
    name: data.name,
    slug: data.slug,
    mainCategory: data.mainCategory,
    thumbnailUrl: data.thumbnailUrl || undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
});

export async function updateBlogSubcategory(id: string, patch: z.infer<typeof updateSchema>): Promise<boolean> {
  const parsed = updateSchema.parse(patch);
  const ref = getAdminDatabase().collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const current = snap.data() as { mainCategory: AdminBlogMainCategory; slug: string };
  // Build a typed, Firestore-friendly update object
  const update: {
    name?: string;
    thumbnailUrl?: string | null;
    updatedAt: number;
  } = { updatedAt: Date.now() };
  if (parsed.name) update.name = parsed.name;
  if (parsed.thumbnailUrl !== undefined) {
    update.thumbnailUrl = parsed.thumbnailUrl ? parsed.thumbnailUrl : null;
  }
  await ref.update(update);
  invalidateCaches(current.mainCategory);
  revalidateBlogRoutes(current.slug);
  return true;
}
