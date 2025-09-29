"use server";

import { database } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { cacheManager, CACHE_KEYS, CACHE_OPTIONS } from "@/lib/cache";
import { CityPage } from "@/types/city/CityPage";
import { CityFAQ } from "@/types/city/CityFAQType";
import { CityPageSection } from "@/types/city/CityPageSection";
import { z } from "zod";

// Collection name
const CITY_PAGES_COLLECTION = "cityPages";

// Basic schema validation (can be extended later)
const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});
const sectionSchema = z.object({
  titel: z.string().min(1),
  image: z.string().url().optional(),
  text: z.string().min(1),
  link: z.string().url().optional(),
});

const cityPageSchema = z.object({
  city: z.string().min(1, "city required"),
  faq: z.array(faqSchema).default([]),
  sections: z.array(sectionSchema).max(3).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export type CreateCityPageInput = z.input<typeof cityPageSchema> & {
  id?: string;
};
export type UpdateCityPageInput = Partial<CreateCityPageInput>;

function sanitize<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k as keyof T];
    if (v !== undefined) out[k as keyof T] = v as T[keyof T];
  });
  return out;
}

function invalidateCityCaches(id?: string, city?: string) {
  try {
    if (id) cacheManager.delete(CACHE_KEYS.CITY_PAGE_BY_ID(id));
    if (city) cacheManager.delete(CACHE_KEYS.CITY_PAGE_BY_CITY(city));
    cacheManager.delete(CACHE_KEYS.CITY_PAGES_LIST);
  } catch {
    /* noop */
  }
}

function revalidateCityRoutes(city?: string) {
  try {
    revalidatePath("/stadt"); // listing page if exists
    if (city) {
      // Revalidate by raw city name (legacy) and by slug (new deterministic ID)
      revalidatePath(`/stadt/${city}`);
      // If city contains spaces/Umlaute the public route actually uses a slug (deslugified previously on read)
      // We trigger also the encoded variant to be safe.
      try {
        const encoded = encodeURIComponent(city.trim());
        if (encoded && encoded !== city) {
          revalidatePath(`/stadt/${encoded}`);
        }
      } catch {
        /* noop */
      }
    }
    revalidatePath("/sitemaps/cities/sitemap.xml");
  } catch {
    /* noop */
  }
}

// Create or upsert a CityPage (if id provided)
export async function createCityPage(
  input: CreateCityPageInput
): Promise<string> {
  const parsed = cityPageSchema.parse({
    city: input.city,
    faq: input.faq || [],
    sections: input.sections || [],
    title: input.title,
    description: input.description,
  });
  const colRef = collection(database, CITY_PAGES_COLLECTION);
  if (input.id) {
    const ref = doc(database, CITY_PAGES_COLLECTION, input.id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, { ...parsed });
    } else {
      await setDoc(ref, { ...parsed });
    }
    invalidateCityCaches(input.id, parsed.city);
    revalidateCityRoutes(parsed.city);
    return input.id;
  } else {
    const docRef = await addDoc(colRef, { ...parsed });
    invalidateCityCaches(docRef.id, parsed.city);
    revalidateCityRoutes(parsed.city);
    return docRef.id;
  }
}

export async function getCityPage(id: string): Promise<CityPage | null> {
  return cacheManager.getOrFetch(
    CACHE_KEYS.CITY_PAGE_BY_ID(id),
    async () => {
      const ref = doc(database, CITY_PAGES_COLLECTION, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const data = snap.data() as Omit<CityPage, "id">;
      return { id: snap.id, ...data } as CityPage;
    },
    CACHE_OPTIONS.CITY_PAGES
  );
}

export async function getCityPageByCity(
  city: string
): Promise<CityPage | null> {
  return cacheManager.getOrFetch(
    CACHE_KEYS.CITY_PAGE_BY_CITY(city),
    async () => {
      const colRef = collection(database, CITY_PAGES_COLLECTION);
      const qCity = query(colRef, where("city", "==", city));
      const snap = await getDocs(qCity);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...(d.data() as Omit<CityPage, "id">) } as CityPage;
    },
    CACHE_OPTIONS.CITY_PAGES
  );
}

export async function listCityPages(): Promise<CityPage[]> {
  return cacheManager.getOrFetch(
    CACHE_KEYS.CITY_PAGES_LIST,
    async () => {
      const colRef = collection(database, CITY_PAGES_COLLECTION);
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CityPage, "id">),
      }));
    },
    CACHE_OPTIONS.CITY_PAGES
  );
}

export async function updateCityPage(
  id: string,
  patch: UpdateCityPageInput
): Promise<boolean> {
  const existing = await getCityPage(id);
  if (!existing) return false;
  const merged: CityPage = {
    id: existing.id,
    city: patch.city ?? existing.city,
    faq: patch.faq ? patch.faq.map((f) => faqSchema.parse(f)) : existing.faq,
    sections: patch.sections
      ? patch.sections.map((s) => sectionSchema.parse(s))
      : existing.sections,
    title: patch.title ?? existing.title,
    description: patch.description ?? existing.description,
  };
  const ref = doc(database, CITY_PAGES_COLLECTION, id);
  await updateDoc(
    ref,
    sanitize({
      city: merged.city,
      faq: merged.faq as CityFAQ[],
      sections: merged.sections as CityPageSection[] | undefined,
      title: merged.title,
      description: merged.description,
    })
  );
  invalidateCityCaches(id, merged.city);
  revalidateCityRoutes(merged.city);
  return true;
}

export async function deleteCityPage(id: string): Promise<boolean> {
  const existing = await getCityPage(id);
  if (!existing) return false;
  const ref = doc(database, CITY_PAGES_COLLECTION, id);
  await deleteDoc(ref);
  invalidateCityCaches(id, existing.city);
  revalidateCityRoutes(existing.city);
  return true;
}

// Manuelle Invalidation Helper (z.B. für Admin Tools)
export async function invalidateCityPageCache(id: string, city?: string) {
  invalidateCityCaches(id, city);
}

export async function invalidateAllCityPagesCache() {
  cacheManager.delete(CACHE_KEYS.CITY_PAGES_LIST);
}
