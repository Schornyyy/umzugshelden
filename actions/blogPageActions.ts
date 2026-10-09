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
  writeBatch,
  orderBy,
  limit,
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cacheManager } from "@/lib/cache";
import type {
  BlogPage,
  BlogPageBlock,
  BlogPageFAQEntry,
  BlogPageSection,
  BlogPageSettings,
} from "@/types/blog/BlogPage";
import type { AdminBlogMainCategory } from "@/types/blog/BlogSubcategory";
import { slugify } from "@/utils/slugify";

const COLLECTION = "blogPages_umzugshelden";

// cache key helpers (local, to avoid editing central enum for now)
const cacheKeyBySlug = (subcategorySlug: string, slug: string) => `BLOG_PAGE_${subcategorySlug}_${slug}`;
const cacheKeyListBySub = (subcategorySlug: string) => `BLOG_PAGES_LIST_${subcategorySlug}`;
const cacheKeyByPath = (path: string) => `BLOG_PAGE_PATH_${path}`;

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

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const safeLinkSchema = z.string().trim().min(1).max(2048).refine(
  (value) => value.startsWith("/") || /^(https?:|mailto:|tel:)/i.test(value),
  "Ungültiger Link"
);

const blockStyleSchema = z.object({
  backgroundColor: colorSchema.optional(),
  backgroundImage: z.string().url().optional(),
  backgroundPosition: z.enum(["top", "center", "bottom"]).optional(),
  overlayColor: colorSchema.optional(),
  overlayOpacity: z.number().min(0).max(100).optional(),
  textColor: colorSchema.optional(),
  accentColor: colorSchema.optional(),
  alignment: z.enum(["left", "center", "right"]).optional(),
  width: z.enum(["narrow", "normal", "wide", "full"]).optional(),
  padding: z.enum(["none", "small", "medium", "large"]).optional(),
  borderRadius: z.enum(["none", "small", "medium", "large"]).optional(),
  headingSize: z.number().min(16).max(96).optional(),
  textSize: z.number().min(10).max(32).optional(),
  paddingTop: z.number().min(0).max(240).optional(),
  paddingBottom: z.number().min(0).max(240).optional(),
  marginTop: z.number().min(0).max(160).optional(),
  marginBottom: z.number().min(0).max(160).optional(),
  minHeight: z.number().min(0).max(1200).optional(),
  borderRadiusPx: z.number().min(0).max(64).optional(),
  hideOnDesktop: z.boolean().optional(),
  hideOnTablet: z.boolean().optional(),
  hideOnMobile: z.boolean().optional(),
});

const blockSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum([
    "heading",
    "richText",
    "image",
    "imageText",
    "quote",
    "button",
    "carousel",
    "divider",
    "spacer",
  ]),
  heading: z.string().max(300).optional(),
  headingLevel: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
  content: z.string().max(500000).optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().max(300).optional(),
  caption: z.string().max(500).optional(),
  imagePosition: z.enum(["left", "right", "full"]).optional(),
  quote: z.string().max(5000).optional(),
  attribution: z.string().max(300).optional(),
  buttonLabel: z.string().max(100).optional(),
  buttonUrl: safeLinkSchema.optional(),
  buttonStyle: z.enum(["primary", "secondary", "outline"]).optional(),
  spacerHeight: z.number().int().min(8).max(240).optional(),
  carouselSlides: z.array(z.object({
    imageUrl: z.string().url().or(z.literal("")),
    imageAlt: z.string().max(300),
    heading: z.string().max(300).optional(),
    text: z.string().max(2000).optional(),
    linkLabel: z.string().max(100).optional(),
    linkUrl: safeLinkSchema.optional(),
  })).max(30).optional(),
  carouselAutoplay: z.boolean().optional(),
  carouselInterval: z.number().int().min(1000).max(30000).optional(),
  carouselShowArrows: z.boolean().optional(),
  carouselShowDots: z.boolean().optional(),
  slides: z.array(z.object({
    image: z.string().url().or(z.literal("")),
    imageAlt: z.string().max(300),
    imageTitle: z.string().max(300).optional(),
    imageCaption: z.string().max(500).optional(),
    heading: z.string().max(300).optional(),
    text: z.string().max(2000).optional(),
    linkLabel: z.string().max(100).optional(),
    linkUrl: safeLinkSchema.optional(),
  })).max(30).optional(),
  autoplay: z.boolean().optional(),
  interval: z.number().int().min(1000).max(30000).optional(),
  showArrows: z.boolean().optional(),
  showDots: z.boolean().optional(),
  style: blockStyleSchema.optional(),
});

const settingsSchema = z.object({
  contentWidth: z.enum(["narrow", "normal", "wide"]),
  fontFamily: z.enum(["sans", "serif"]),
  pageBackground: colorSchema,
  contentBackground: colorSchema,
  textColor: colorSchema,
  headingColor: colorSchema,
  accentColor: colorSchema,
  showBreadcrumbs: z.boolean(),
  showThumbnail: z.boolean(),
  showCta: z.boolean(),
  ctaTitle: z.string().max(200),
  ctaText: z.string().max(500),
  ctaLabel: z.string().max(100),
  ctaUrl: safeLinkSchema,
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
  blocks: z.array(blockSchema).max(100).optional(),
  settings: settingsSchema.optional(),
  visible: z.boolean().default(false),
  slug: z.string().trim().min(1).max(120).optional(),
  parentId: z.string().trim().min(1).nullable().optional(),
});

export type CreateBlogPageInput = z.infer<typeof baseSchema> & { id?: string };
export type UpdateBlogPageInput = Partial<
  Omit<CreateBlogPageInput, "thumbnailUrl" | "meta_description">
> & {
  thumbnailUrl?: string | null;
  meta_description?: string | null;
};

type FirestoreBlogPagePatch = Omit<
  Partial<BlogPage>,
  "thumbnailUrl" | "meta_description"
> & {
  thumbnailUrl?: string | null;
  meta_description?: string | null;
};

function buildSlug(titel: string) {
  return slugify(titel.trim().toLowerCase());
}

function normalizePath(value: string) {
  return value.split("/").map((part) => slugify(part.trim().toLowerCase())).filter(Boolean).join("/");
}

function getStoredPath(page: Partial<BlogPage>) {
  if (page.path) return normalizePath(page.path);
  return normalizePath(`${page.mainCategory || ""}/${page.subcategorySlug || ""}/${page.slug || ""}`);
}

async function getAllBlogPagesRaw() {
  const snap = await getDocs(collection(database, COLLECTION));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<BlogPage, "id">) }));
}

async function resolvePagePath(
  slug: string,
  parentId: string | null | undefined,
  currentId?: string,
) {
  const pages = await getAllBlogPagesRaw();
  if (parentId === currentId) throw new Error("Eine Seite kann nicht ihr eigener Elternpunkt sein");
  const parent = parentId ? pages.find((page) => page.id === parentId) : undefined;
  if (parentId && !parent) throw new Error("Die gewählte übergeordnete Seite existiert nicht");

  if (currentId && parent) {
    let ancestor: typeof parent | undefined = parent;
    const visited = new Set<string>();
    while (ancestor) {
      if (ancestor.id === currentId) throw new Error("Unterseiten können nicht zu ihren eigenen Eltern gemacht werden");
      if (visited.has(ancestor.id)) throw new Error("Ungültige Seitenhierarchie");
      visited.add(ancestor.id);
      ancestor = ancestor.parentId
        ? pages.find((page) => page.id === ancestor?.parentId)
        : undefined;
    }
  }

  const path = normalizePath(parent ? `${getStoredPath(parent)}/${slug}` : slug);
  const duplicate = pages.find((page) => page.id !== currentId && getStoredPath(page) === path);
  if (duplicate) throw new Error(`Die Blog-URL /blog/${path} ist bereits vergeben`);
  return { path, pages };
}

function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(removeUndefinedDeep) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([key, nestedValue]) => [key, removeUndefinedDeep(nestedValue)])
    ) as T;
  }
  return value;
}

function invalidateCaches(subcategorySlug: string, slug?: string, path?: string) {
  try {
    cacheManager.delete(cacheKeyListBySub(subcategorySlug));
    if (slug) cacheManager.delete(cacheKeyBySlug(subcategorySlug, slug));
    if (path) cacheManager.delete(cacheKeyByPath(path));
  } catch {}
}

function revalidateBlogRoutes(subcategorySlug: string, slug?: string) {
  try {
    revalidatePath("/blog");
    revalidatePath(`/blog/${subcategorySlug}`);
    if (slug) revalidatePath(`/blog/${subcategorySlug}/${slug}`);
    revalidatePath("/blog", "layout");
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
    blocks: input.blocks,
    settings: input.settings,
    visible: input.visible ?? false,
  });

  const slug = normalizePath(input.slug || buildSlug(parsed.titel));
  if (slug.includes("/")) throw new Error("Der Slug darf nur aus einem URL-Segment bestehen");
  const { path } = await resolvePagePath(slug, input.parentId, input.id);
  const colRef = collection(database, COLLECTION);
  const now = Date.now();

  if (input.id) {
    const ref = doc(database, COLLECTION, input.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      // do not allow slug change if doc exists already (slug stable from initial title)
      await updateDoc(ref, removeUndefinedDeep({
        titel: parsed.titel,
        description: parsed.description,
        subcategorySlug: parsed.subcategorySlug,
        mainCategory: parsed.mainCategory,
        thumbnailUrl: parsed.thumbnailUrl || null,
        keywords: parsed.keywords || [],
        meta_description: parsed.meta_description || null,
        sections: parsed.sections as BlogPageSection[],
        faq: parsed.faq as BlogPageFAQEntry[],
        blocks: parsed.blocks as BlogPageBlock[] | undefined,
        settings: parsed.settings as BlogPageSettings | undefined,
        slug,
        path,
        parentId: input.parentId || null,
        visible: parsed.visible,
        updatedAt: now,
      }));
      const existingData = existing.data() as { slug: string; path?: string };
      invalidateCaches(parsed.subcategorySlug, existingData.slug, existingData.path);
      revalidateBlogRoutes(parsed.subcategorySlug, existingData.slug);
      return ref.id;
    } else {
      await setDoc(ref, removeUndefinedDeep({
        slug,
        path,
        parentId: input.parentId || null,
        titel: parsed.titel,
        description: parsed.description,
        subcategorySlug: parsed.subcategorySlug,
        mainCategory: parsed.mainCategory,
        thumbnailUrl: parsed.thumbnailUrl || null,
        keywords: parsed.keywords || [],
        meta_description: parsed.meta_description || null,
        sections: parsed.sections as BlogPageSection[],
        faq: parsed.faq as BlogPageFAQEntry[],
        blocks: parsed.blocks as BlogPageBlock[] | undefined,
        settings: parsed.settings as BlogPageSettings | undefined,
        visible: parsed.visible,
        createdAt: now,
        updatedAt: now,
      }));
      invalidateCaches(parsed.subcategorySlug, slug);
      revalidateBlogRoutes(parsed.subcategorySlug, slug);
      return ref.id;
    }
  } else {
    const docRef = await addDoc(colRef, removeUndefinedDeep({
      slug,
      path,
      parentId: input.parentId || null,
      titel: parsed.titel,
      description: parsed.description,
      subcategorySlug: parsed.subcategorySlug,
      mainCategory: parsed.mainCategory,
      thumbnailUrl: parsed.thumbnailUrl || null,
      keywords: parsed.keywords || [],
      meta_description: parsed.meta_description || null,
      sections: parsed.sections as BlogPageSection[],
      faq: parsed.faq as BlogPageFAQEntry[],
      blocks: parsed.blocks as BlogPageBlock[] | undefined,
      settings: parsed.settings as BlogPageSettings | undefined,
      visible: parsed.visible,
      createdAt: now,
      updatedAt: now,
    }));
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
    path: getStoredPath(data),
    parentId: data.parentId || null,
    titel: data.titel,
    description: data.description,
    subcategorySlug: data.subcategorySlug,
    mainCategory: data.mainCategory,
    thumbnailUrl: data.thumbnailUrl || undefined,
    keywords: data.keywords || [],
    meta_description: data.meta_description || undefined,
    sections: (data.sections || []) as BlogPageSection[],
    faq: (data.faq || []) as BlogPageFAQEntry[],
    blocks: data.blocks as BlogPageBlock[] | undefined,
    settings: data.settings as BlogPageSettings | undefined,
    visible: data.visible ?? false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  cacheManager.set(cacheKey, page, { ttl: 5 * 60 * 1000 });
  return page;
}

export async function getBlogPageByPath(path: string): Promise<BlogPage | null> {
  const normalized = normalizePath(path);
  const key = cacheKeyByPath(normalized);
  const cached = cacheManager.get<BlogPage>(key);
  if (cached) return cached;

  const pages = await getAllBlogPagesRaw();
  const page = pages.find((item) => getStoredPath(item) === normalized) || null;
  if (page) cacheManager.set(key, page, { ttl: 5 * 60 * 1000 });
  return page;
}

export async function listAllBlogPages(): Promise<BlogPage[]> {
  const pages = await getAllBlogPagesRaw();
  return pages
    .map((page) => ({ ...page, path: getStoredPath(page), parentId: page.parentId || null }))
    .sort((a, b) => getStoredPath(a).localeCompare(getStoredPath(b), "de"));
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
      path: getStoredPath(data),
      parentId: data.parentId || null,
      titel: data.titel,
      description: data.description,
      subcategorySlug: data.subcategorySlug,
      mainCategory: data.mainCategory,
      thumbnailUrl: data.thumbnailUrl || undefined,
      keywords: data.keywords || [],
      meta_description: data.meta_description || undefined,
      sections: data.sections || [],
      faq: data.faq || [],
      blocks: data.blocks as BlogPageBlock[] | undefined,
      settings: data.settings as BlogPageSettings | undefined,
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
  const currentPath = getStoredPath(existing);
  const parsedPatch: FirestoreBlogPagePatch = {};

  if (patch.titel !== undefined) parsedPatch.titel = patch.titel; // slug not recalculated
  const nextSlug = patch.slug !== undefined ? normalizePath(patch.slug) : currentSlug;
  if (!nextSlug || nextSlug.includes("/")) throw new Error("Der Slug muss genau ein gültiges URL-Segment enthalten");
  const nextParentId = patch.parentId !== undefined ? patch.parentId : existing.parentId;
  if (patch.slug !== undefined || patch.parentId !== undefined) {
    const { path: nextPath, pages } = await resolvePagePath(nextSlug, nextParentId, id);
    parsedPatch.slug = nextSlug;
    parsedPatch.path = nextPath;
    parsedPatch.parentId = nextParentId || null;

    if (nextPath !== currentPath) {
      const descendants = pages
        .filter((page) => page.id !== id && getStoredPath(page).startsWith(`${currentPath}/`))
        .sort((a, b) => getStoredPath(a).length - getStoredPath(b).length);
      const movedIds = new Set(descendants.map((page) => page.id));
      for (const descendant of descendants) {
        const descendantPath = `${nextPath}${getStoredPath(descendant).slice(currentPath.length)}`;
        const collision = pages.find(
          (page) =>
            page.id !== id &&
            !movedIds.has(page.id) &&
            getStoredPath(page) === descendantPath,
        );
        if (collision) {
          throw new Error(`Die Unterseiten-URL /blog/${descendantPath} ist bereits vergeben`);
        }
      }
      const batch = writeBatch(database);
      descendants.forEach((page) => {
        const descendantPath = `${nextPath}${getStoredPath(page).slice(currentPath.length)}`;
        batch.update(doc(database, COLLECTION, page.id), {
          path: descendantPath,
          updatedAt: Date.now(),
        });
        invalidateCaches(page.subcategorySlug, page.slug, getStoredPath(page));
      });
      if (descendants.length) await batch.commit();
    }
  }
  if (patch.description !== undefined) parsedPatch.description = patch.description;
  if (patch.thumbnailUrl !== undefined) parsedPatch.thumbnailUrl = patch.thumbnailUrl || null;
  if (patch.keywords !== undefined) parsedPatch.keywords = patch.keywords || [];
  if (patch.meta_description !== undefined) parsedPatch.meta_description = patch.meta_description || null;
  if (patch.sections !== undefined) {
    parsedPatch.sections = patch.sections.map((s) => sectionSchema.parse(s)) as BlogPageSection[];
  }
  if (patch.faq !== undefined) {
    parsedPatch.faq = patch.faq.map((f) => faqSchema.parse(f)) as BlogPageFAQEntry[];
  }
  if (patch.blocks !== undefined) {
    parsedPatch.blocks = patch.blocks.map((block) => blockSchema.parse(block)) as BlogPageBlock[];
  }
  if (patch.settings !== undefined) {
    parsedPatch.settings = settingsSchema.parse(patch.settings) as BlogPageSettings;
  }
  if (patch.visible !== undefined) parsedPatch.visible = patch.visible;
  parsedPatch.updatedAt = Date.now();

  await updateDoc(ref, removeUndefinedDeep(parsedPatch));
  invalidateCaches(existing.subcategorySlug, currentSlug, currentPath);
  revalidateBlogRoutes(existing.subcategorySlug, currentSlug);
  return true;
}

export async function deleteBlogPage(id: string): Promise<boolean> {
  const ref = doc(database, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data() as BlogPage;
  const pages = await getAllBlogPagesRaw();
  if (pages.some((page) => page.parentId === id)) {
    throw new Error("Diese Seite besitzt Unterseiten. Bitte verschiebe oder lösche diese zuerst.");
  }
  await deleteDoc(ref);
  invalidateCaches(data.subcategorySlug, data.slug, getStoredPath(data));
  revalidateBlogRoutes(data.subcategorySlug, data.slug);
  return true;
}
