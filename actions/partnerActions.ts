"use server";

import { database } from "@/config/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  updateDoc,
  where,
  doc,
  getDoc,
  orderBy,
  limit as fsLimit,
  increment,
} from "firebase/firestore";
import { PartnerType } from "@/types/PartnerType";
import { PartnerEvent } from "@/types/PartnerEvent";
import { cacheManager, CACHE_KEYS, CACHE_OPTIONS } from "@/lib/cache";
import { z } from "zod";

export interface PartnerProfile {
  ownerid: string; // Account ID
  email: string;
  contactPerson: string;
  logo?: string;
  website?: string;
  phone?: string;
  images?: string[];
  texts?: string[];
  createdAt?: number;
  updatedAt?: number;
}

const PARTNERS_COLLECTION = "partners";

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as Array<keyof T>).forEach((k) => {
    const v = obj[k];
    if (v !== undefined) {
      out[k] = v as T[keyof T];
    }
  });
  return out;
}

export async function createPartnerProfile(profile: PartnerProfile): Promise<boolean> {
  const col = collection(database, PARTNERS_COLLECTION);
  await addDoc(col, { ...profile, createdAt: Date.now(), updatedAt: Date.now(), type: "partner" });
  return true;
}

export async function findPartnerByOwnerId(ownerid: string): Promise<(PartnerProfile & { id: string }) | null> {
  const col = collection(database, PARTNERS_COLLECTION);
  const q = query(col, where("ownerid", "==", ownerid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as PartnerProfile) };
}

export async function getPartnerById(id: string): Promise<(PartnerProfile & { id: string }) | null> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  return { id: s.id, ...(s.data() as PartnerProfile) };
}

// Find the catalog partner doc by owner account ID
export async function findCatalogPartnerByOwnerId(ownerid: string): Promise<(PartnerType & { id: string }) | null> {
  const colRef = collection(database, PARTNERS_COLLECTION);
  const qRef = query(colRef, where("type", "==", "catalog"), where("ownerid", "==", ownerid));
  const snap = await getDocs(qRef);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<PartnerType, "id">) };
}

export async function updatePartnerProfile(id: string, patch: Partial<PartnerProfile>): Promise<boolean> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  await updateDoc(ref, omitUndefined({ ...patch, updatedAt: Date.now() }));
  return true;
}

// New APIs used by admin page and API routes

export async function getPartner(id: string): Promise<(PartnerType & { id: string }) | null> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  // Firestore is schemaless; cast to Omit to avoid duplicate 'id' warning
  return { id: s.id, ...(s.data() as Omit<PartnerType, "id">) };
}

export async function incrementPartnerClick(id: string): Promise<void> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  await updateDoc(ref, { clicks: increment(1), updatedAt: Date.now() });
}

export async function listPartnerEvents(
  partnerId: string,
  take: number = 25
): Promise<PartnerEvent[]> {
  const eventsCol = collection(database, PARTNERS_COLLECTION, partnerId, "events");
  const q = query(eventsCol, orderBy("createdAt", "desc"), fsLimit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PartnerEvent, "id">) }));
}

// Stats fields on catalog partner docs (kept optional for back-compat):
// websiteClicks, emailClicks, phoneClicks, views

export type PartnerStats = {
  websiteClicks?: number;
  emailClicks?: number;
  phoneClicks?: number;
  views?: number;
};

export async function incrementPartnerStat(
  partnerId: string,
  kind: keyof PartnerStats
): Promise<void> {
  const ref = doc(database, PARTNERS_COLLECTION, partnerId);
  await updateDoc(ref, { [kind]: increment(1), updatedAt: Date.now() });
}

export async function addPartnerEvent(
  partnerId: string,
  event: Omit<PartnerEvent, "id">
): Promise<void> {
  const eventsCol = collection(database, PARTNERS_COLLECTION, partnerId, "events");
  await addDoc(eventsCol, event);
}

export async function listPartnerStats(partnerId: string): Promise<PartnerStats> {
  const fetcher = async () => {
    const ref = doc(database, PARTNERS_COLLECTION, partnerId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return {} as PartnerStats;
    const d = snap.data() as PartnerType & PartnerStats;
    return {
      websiteClicks: d.websiteClicks || 0,
      emailClicks: d.emailClicks || 0,
      phoneClicks: d.phoneClicks || 0,
      views: d.views || 0,
    } as PartnerStats;
  };
  return cacheManager.getOrFetch(
    CACHE_KEYS.PARTNER_STATS(partnerId),
    fetcher,
    CACHE_OPTIONS.PARTNER_STATS
  );
}

export async function updatePartnerFromForm(partnerId: string, formData: FormData): Promise<void> {
  const patch: Partial<PartnerType> = {
    name: (formData.get("name") as string) ?? undefined,
    logo: (formData.get("logo") as string) ?? undefined,
    category: (formData.get("category") as string) ?? undefined,
    benefit: (formData.get("benefit") as string) ?? undefined,
    description: (formData.get("description") as string) ?? undefined,
    link: (formData.get("link") as string) ?? undefined,
    priority: formData.get("priority") !== null ? Number(formData.get("priority")) : undefined,
    active: formData.get("active") !== null,
  };
  const ref = doc(database, PARTNERS_COLLECTION, partnerId);
  await updateDoc(ref, omitUndefined({ ...patch, updatedAt: Date.now() }));
}

// Admin catalog management

export async function listPartners(): Promise<PartnerType[]> {
  const col = collection(database, PARTNERS_COLLECTION);
  // Prefer type=catalog to distinguish from profile docs
  const q = query(col, where("type", "==", "catalog"), orderBy("priority", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PartnerType, "id">) }));
}

export async function createPartner(data: Omit<PartnerType, "id">): Promise<string> {
  const col = collection(database, PARTNERS_COLLECTION);
  const now = Date.now();
  const payload = omitUndefined({
    ...data,
    type: "catalog",
    clicks: data.clicks ?? 0,
    createdAt: now,
    updatedAt: now,
  });
  const docRef = await addDoc(col, payload);
  return docRef.id;
}

export async function updatePartner(id: string, patch: Partial<PartnerType>): Promise<void> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  await updateDoc(ref, omitUndefined({ ...patch, updatedAt: Date.now(), type: "catalog" }));
}

export async function removePartner(id: string): Promise<void> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  await deleteDoc(ref);
}

// Unified validated save (create or update)
const partnerInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name ist erforderlich").transform((s) => s.trim()),
  logo: z.string().min(1, "Logo ist erforderlich").transform((s) => s.trim()),
  benefit: z.string().min(1, "Vorteil ist erforderlich").transform((s) => s.trim()),
  link: z
    .string()
    .optional()
    .transform((s) => (s ? s.trim() : undefined))
    .refine((s) => !s || /^https?:\/\//i.test(s), {
      message: "Link muss mit http(s) beginnen",
    }),
  category: z.string().optional().transform((s) => (s ? s.trim() : undefined)),
  active: z.boolean().optional().default(true),
  priority: z
    .number()
    .int()
    .min(0)
    .max(100000)
    .optional()
    .default(100),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export type SavePartnerInput = z.input<typeof partnerInputSchema>;

export async function savePartner(input: SavePartnerInput): Promise<{ id: string; created: boolean }>{
  const parsed = partnerInputSchema.parse(input);
  const base: Omit<PartnerType, "id"> = {
    name: parsed.name,
    logo: parsed.logo,
    benefit: parsed.benefit,
    link: parsed.link,
    category: parsed.category,
    active: parsed.active ?? true,
    priority: parsed.priority ?? 100,
    description: parsed.description,
    tags: parsed.tags ?? [],
    clicks: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };

  if (parsed.id) {
    await updatePartner(parsed.id, base);
    return { id: parsed.id, created: false };
  }
  const id = await createPartner(base);
  return { id, created: true };
}

// Migration: Create catalog docs from existing partner profiles (type: 'partner')
export async function migratePartnerProfilesToCatalog(): Promise<{
  created: number;
  skipped: number;
  errors: number;
}> {
  const colRef = collection(database, PARTNERS_COLLECTION);
  // Get all partner profiles
  const profilesSnap = await getDocs(query(colRef, where("type", "==", "partner")));

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const profileDoc of profilesSnap.docs) {
    try {
      const profile = profileDoc.data() as PartnerProfile & { id?: string };

      // Check if a catalog doc already exists linked to this profile via profileId
      const existingCatalog = await getDocs(
        query(colRef, where("type", "==", "catalog"), where("profileId", "==", profileDoc.id))
      );
      if (!existingCatalog.empty) {
        skipped++;
        continue;
      }

      // Derive minimal catalog fields
      const name = (profile as { name?: string }).name || profile.contactPerson || profile.email?.split("@")[0] || "Partner";
      // Prefer explicit profile.logo, then first image
      const logo = (profile as { logo?: string }).logo || (Array.isArray(profile.images) ? profile.images[0] : "") || "";
      const benefit = "Noch kein Vorteil hinterlegt.";
      const link = profile.website || undefined;
      const description = Array.isArray(profile.texts) && profile.texts[0] ? profile.texts[0] : undefined;

      const now = Date.now();
      // Create the catalog doc directly to include profileId for deduplication
      await addDoc(colRef, omitUndefined({
        type: "catalog",
        profileId: profileDoc.id,
        ownerid: profile.ownerid,
        name,
        logo,
        benefit,
        link,
        category: undefined,
        active: true,
        priority: 100,
        description,
        tags: [],
        clicks: 0,
        createdAt: now,
        updatedAt: now,
      }));
      created++;
    } catch {
      errors++;
    }
  }

  return { created, skipped, errors };
}

// Fetch a partner profile by document id
export async function getPartnerProfile(profileId: string): Promise<(PartnerProfile & { id: string }) | null> {
  const ref = doc(database, PARTNERS_COLLECTION, profileId);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  return { id: s.id, ...(s.data() as PartnerProfile) };
}

// Ensure a catalog partner has a linked profile; create one if missing and return profileId
export async function ensureProfileForCatalogPartner(partnerId: string): Promise<string> {
  const catRef = doc(database, PARTNERS_COLLECTION, partnerId);
  const s = await getDoc(catRef);
  if (!s.exists()) throw new Error("Partner nicht gefunden");
  const data = s.data() as Record<string, unknown>;
  if (data.type !== "catalog") return partnerId; // already a profile doc
  const existingProfileId = (data.profileId as string | undefined) || undefined;
  if (existingProfileId) {
    return existingProfileId;
  }
  // Create minimal profile
  const now = Date.now();
  const col = collection(database, PARTNERS_COLLECTION);
  const profileDoc = await addDoc(col, omitUndefined({
    type: "partner",
    ownerid: (data.ownerid as string | undefined) || undefined,
    email: (data.email as string | undefined) || "",
    contactPerson: (data.contactPerson as string | undefined) || "",
    logo: (data.logo as string | undefined) || undefined,
    website: (data.website as string | undefined) || undefined,
    phone: (data.phone as string | undefined) || undefined,
    images: [],
    texts: ["", "", ""],
    createdAt: now,
    updatedAt: now,
  }));
  await updateDoc(catRef, { profileId: profileDoc.id, updatedAt: Date.now() });
  return profileDoc.id;
}