"use server";

import { database } from "@/config/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  setDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cacheManager } from "@/lib/cache";
import type { BlogPage, BlogPageSection, BlogPageFAQEntry } from "@/types/blog/BlogPage";
import type { AdminBlogMainCategory } from "@/types/blog/BlogSubcategory";
import { slugify } from "@/utils/slugify";

const COLLECTION = "blogPages_umzugshelden";

// cache key helpers (local, to avoid editing central enum for now)
const cacheKeyBySlug = (subcategorySlug: string, slug: string) => `BLOG_PAGE_${subcategorySlug}_${slug}`;
const cacheKeyListBySub = (subcategorySlug: string) => `BLOG_PAGES_LIST_${subcategorySlug}`;

// Zod schemas
const sectionSchema = z.object({
  titel: z.string().min(1),
  text: z.string().min(1), // raw JSON string
  image: z.string().url().optional(),
  link: z.string().url().optional(),
});

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1), // raw JSON string
});

const baseSchema = z.object({
  titel: z.string().min(3),
  description: z.string().min(5),
  subcategorySlug: z.string().min(1),
  mainCategory: z.custom<AdminBlogMainCategory>(),
  thumbnailUrl: z.string().url().optional(),
  keywords: z.array(z.string().min(1)).max(25).optional(),
  meta_description: z.string().max(300).optional(),
  sections: z.array(sectionSchema).max(20).default([]),
  faq: z.array(faqSchema).max(30).default([]),
  visible: z.boolean().default(false),
});

export type CreateBlogPageInput = z.infer<typeof baseSchema> & { id?: string };
export type UpdateBlogPageInput = Partial<CreateBlogPageInput>;

function buildSlug(titel: string) {
  return slugify(titel.trim().toLowerCase());
}

function sanitize<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k];
    if (v !== undefined) {
      out[k] = v;
    }
  });
  return out;
}

function invalidateCaches(subcategorySlug: string, slug?: string) {
  try {
    cacheManager.delete(cacheKeyListBySub(subcategorySlug));
    if (slug) cacheManager.delete(cacheKeyBySlug(subcategorySlug, slug));
  } catch {}
}

function revalidateBlogRoutes(subcategorySlug: string, slug?: string) {
  try {
    revalidatePath("/blog");
    revalidatePath(`/blog/${subcategorySlug}`);
    if (slug) revalidatePath(`/blog/${subcategorySlug}/${slug}`);
  } catch {}
}

export async function createBlogPage(input: CreateBlogPageInput): Promise<string> {
  const parsed = baseSchema.parse({
    titel: input.titel,
    description: input.description,
    subcategorySlug: input.subcategorySlug,
    mainCategory: input.mainCategory,
    thumbnailUrl: input.thumbnailUrl,
    keywords: input.keywords,
    meta_description: input.meta_description,
    sections: input.sections || [],
    faq: input.faq || [],
    visible: input.visible ?? false,
  });

  const slug = buildSlug(parsed.titel);
  const colRef = collection(database, COLLECTION);
  // slug uniqueness per subcategory
  const qDup = query(colRef, where("subcategorySlug", "==", parsed.subcategorySlug), where("slug", "==", slug));
  const dupSnap = await getDocs(qDup);
  if (!dupSnap.empty) throw new Error("Blog Seite mit diesem Titel/Slug existiert bereits");

  const now = Date.now();

  if (input.id) {
    const ref = doc(database, COLLECTION, input.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      // do not allow slug change if doc exists already (slug stable from initial title)
      await updateDoc(ref, {
        titel: parsed.titel,
        description: parsed.description,
        subcategorySlug: parsed.subcategorySlug,
        mainCategory: parsed.mainCategory,
        thumbnailUrl: parsed.thumbnailUrl || null,
        keywords: parsed.keywords || [],
        meta_description: parsed.meta_description || null,
        sections: parsed.sections as BlogPageSection[],
        faq: parsed.faq as BlogPageFAQEntry[],
        visible: parsed.visible,
        updatedAt: now,
      });
      const existingData = existing.data() as { slug: string };
      invalidateCaches(parsed.subcategorySlug, existingData.slug);
      revalidateBlogRoutes(parsed.subcategorySlug, existingData.slug);
      return ref.id;
    } else {
      await setDoc(ref, {
        slug,
        titel: parsed.titel,
        description: parsed.description,
        subcategorySlug: parsed.subcategorySlug,
        mainCategory: parsed.mainCategory,
        thumbnailUrl: parsed.thumbnailUrl || null,
        keywords: parsed.keywords || [],
        meta_description: parsed.meta_description || null,
        sections: parsed.sections as BlogPageSection[],
        faq: parsed.faq as BlogPageFAQEntry[],
        visible: parsed.visible,
        createdAt: now,
        updatedAt: now,
      });
      invalidateCaches(parsed.subcategorySlug, slug);
      revalidateBlogRoutes(parsed.subcategorySlug, slug);
      return ref.id;
    }
  } else {
    const docRef = await addDoc(colRef, {
      slug,
      titel: parsed.titel,
      description: parsed.description,
      subcategorySlug: parsed.subcategorySlug,
      mainCategory: parsed.mainCategory,
      thumbnailUrl: parsed.thumbnailUrl || null,
      keywords: parsed.keywords || [],
      meta_description: parsed.meta_description || null,
      sections: parsed.sections as BlogPageSection[],
      faq: parsed.faq as BlogPageFAQEntry[],
      visible: parsed.visible,
      createdAt: now,
      updatedAt: now,
    });
    invalidateCaches(parsed.subcategorySlug, slug);
    revalidateBlogRoutes(parsed.subcategorySlug, slug);
    return docRef.id;
  }
}

export async function getBlogPageBySlug(subcategorySlug: string, slug: string): Promise<BlogPage | null> {
  const cacheKey = cacheKeyBySlug(subcategorySlug, slug);
  const cached = cacheManager.get<BlogPage>(cacheKey);
  if (cached) return cached;

  const colRef = collection(database, COLLECTION);
  const qRef = query(colRef, where("subcategorySlug", "==", subcategorySlug), where("slug", "==", slug));
  const snap = await getDocs(qRef);
  if (snap.empty) return null;
  const d = snap.docs[0];
  type Raw = Omit<BlogPage, "id"> & { sections?: BlogPageSection[]; faq?: BlogPageFAQEntry[] };
  const data = d.data() as Raw;
  const page: BlogPage = {
    id: d.id,
    slug: data.slug,
    titel: data.titel,
    description: data.description,
    subcategorySlug: data.subcategorySlug,
    mainCategory: data.mainCategory,
    thumbnailUrl: data.thumbnailUrl || undefined,
    keywords: data.keywords || [],
    meta_description: data.meta_description || undefined,
    sections: (data.sections || []) as BlogPageSection[],
    faq: (data.faq || []) as BlogPageFAQEntry[],
    visible: data.visible ?? false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  cacheManager.set(cacheKey, page, { ttl: 5 * 60 * 1000 });
  return page;
}

export async function listBlogPagesBySubcategory(subcategorySlug: string): Promise<BlogPage[]> {
  const key = cacheKeyListBySub(subcategorySlug);
  const cached = cacheManager.get<BlogPage[]>(key);
  if (cached) return cached;
  const colRef = collection(database, COLLECTION);
  const qRef = query(colRef, where("subcategorySlug", "==", subcategorySlug), orderBy("createdAt", "desc"), limit(200));
  const snap = await getDocs(qRef);
  type Raw = Omit<BlogPage, "id"> & { sections?: BlogPageSection[]; faq?: BlogPageFAQEntry[] };
  const pages: BlogPage[] = snap.docs.map((d) => {
    const data = d.data() as Raw;
    return {
      id: d.id,
      slug: data.slug,
      titel: data.titel,
      description: data.description,
      subcategorySlug: data.subcategorySlug,
      mainCategory: data.mainCategory,
      thumbnailUrl: data.thumbnailUrl || undefined,
      keywords: data.keywords || [],
      meta_description: data.meta_description || undefined,
      sections: data.sections || [],
      faq: data.faq || [],
      visible: data.visible ?? false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
  cacheManager.set(key, pages, { ttl: 5 * 60 * 1000 });
  return pages;
}

// Lightweight pagination (fetch up to 200 cached then slice). For large data sets switch to cursor-based Firestore queries.
export async function listBlogPagesBySubcategoryPaginated(subcategorySlug: string, page: number, pageSize = 12): Promise<{ items: BlogPage[]; total: number; page: number; pageSize: number; totalPages: number; }> {
  const all = await listBlogPagesBySubcategory(subcategorySlug);
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  return { items, total, page: safePage, pageSize, totalPages };
}

export async function updateBlogPage(id: string, patch: UpdateBlogPageInput): Promise<boolean> {
  const ref = doc(database, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const existing = snap.data() as {
    slug: string;
    subcategorySlug: string;
  } & Partial<BlogPage>;
  const currentSlug: string = existing.slug;
  const parsedPatch: Partial<BlogPage> = {};

  if (patch.titel !== undefined) parsedPatch.titel = patch.titel; // slug not recalculated
  if (patch.description !== undefined) parsedPatch.description = patch.description;
  if (patch.thumbnailUrl !== undefined) parsedPatch.thumbnailUrl = patch.thumbnailUrl || undefined;
  if (patch.keywords !== undefined) parsedPatch.keywords = patch.keywords || [];
  if (patch.meta_description !== undefined) parsedPatch.meta_description = patch.meta_description || undefined;
  if (patch.sections !== undefined) {
    parsedPatch.sections = patch.sections.map((s) => sectionSchema.parse(s)) as BlogPageSection[];
  }
  if (patch.faq !== undefined) {
    parsedPatch.faq = patch.faq.map((f) => faqSchema.parse(f)) as BlogPageFAQEntry[];
  }
  if (patch.visible !== undefined) parsedPatch.visible = patch.visible;
  parsedPatch.updatedAt = Date.now();

  await updateDoc(ref, sanitize(parsedPatch));
  invalidateCaches(existing.subcategorySlug, currentSlug);
  revalidateBlogRoutes(existing.subcategorySlug, currentSlug);
  return true;
}

export async function deleteBlogPage(id: string): Promise<boolean> {
  const ref = doc(database, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data() as { subcategorySlug: string; slug: string };
  await deleteDoc(ref);
  invalidateCaches(data.subcategorySlug, data.slug);
  revalidateBlogRoutes(data.subcategorySlug, data.slug);
  return true;
}
