"use server";

// Rewritten partner actions for new nested PartnerType schema (contact, company, infos, companyBenefits)
// Backwards compatibility: legacy functions (profile-related) return synthesized data

import { database } from "@/config/firebase";
import { revalidatePath } from "next/cache";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  updateDoc,
  setDoc,
  doc,
  getDoc,
  orderBy,
  increment,
  where,
} from "firebase/firestore";
import { PartnerType } from "@/types/PartnerType";
import { PartnerEvent } from "@/types/PartnerEvent";
import { cacheManager, CACHE_KEYS, CACHE_OPTIONS } from "@/lib/cache";
import { z } from "zod";

const PARTNERS_COLLECTION = "partners";

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as Array<keyof T>).forEach((k) => {
    const v = obj[k];
    if (v !== undefined) out[k] = v as T[keyof T];
  });
  return out;
}

// =====================
// Validation Schemas
// =====================
const contactSchema = z.object({
  person: z.string().min(1, "Kontaktperson erforderlich"),
  email: z.string().email(),
  phone: z.string().optional().default("")
});
const companySchema = z.object({
  name: z.string().min(1, "Firmenname erforderlich"),
  street: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().optional()
});
const infosSchema = z.object({
  website: z.string().url().or(z.literal("")).transform(s=>s||""),
  logoPath: z.string().optional()
});
const basePartnerSchema = z.object({
  contact: contactSchema,
  company: companySchema,
  infos: infosSchema,
  companyBenefits: z.string().optional().default(""),
  shortDescription: z.string().max(300).optional(),
  category: z.string().optional(),
  active: z.boolean().optional().default(true),
  priority: z.number().int().min(0).max(100000).optional().default(100),
  id: z.string().optional(),
});

export type CreatePartnerInput = z.input<typeof basePartnerSchema>;
export type UpdatePartnerInput = Partial<CreatePartnerInput>;

// =====================
// Core CRUD
// =====================
export async function createPartner(input: CreatePartnerInput): Promise<string> {
  const parsed = basePartnerSchema.parse(input);
  const now = Date.now();
  const col = collection(database, PARTNERS_COLLECTION);
  const payload: Omit<PartnerType, "id"> & Record<string, unknown> = {
    contact: parsed.contact,
    company: parsed.company,
    infos: parsed.infos,
    companyBenefits: parsed.companyBenefits || "",
    shortDescription: parsed.shortDescription,
    category: parsed.category,
    createdAt: now,
    updatedAt: now,
    active: parsed.active ?? true,
    priority: parsed.priority ?? 100,
  };
  if (parsed.id) {
    const ref = doc(database, PARTNERS_COLLECTION, parsed.id);
    // Use setDoc with merge to allow upsert semantics without type casting issues
    await setDoc(ref, payload, { merge: true });
    invalidatePartnerListCaches();
    revalidatePartnersRoutes(parsed.category);
    return parsed.id;
  }
  const docRef = await addDoc(col, payload);
  invalidatePartnerListCaches();
  revalidatePartnersRoutes(parsed.category);
  return docRef.id;
}

export async function getPartner(id: string): Promise<(PartnerType & { id: string }) | null> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<PartnerType, "id">) };
}

export async function updatePartner(id: string, patch: UpdatePartnerInput): Promise<boolean> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  const existing = await getPartner(id);
  if (!existing) return false;
  const merged = {
    ...existing,
    ...omitUndefined(patch),
    contact: { ...existing.contact, ...patch.contact },
    company: { ...existing.company, ...patch.company },
    infos: { ...existing.infos, ...patch.infos },
    companyBenefits: patch.companyBenefits ?? existing.companyBenefits,
    category: patch.category ?? existing.category,
    active: patch.active ?? existing.active,
    priority: patch.priority ?? existing.priority,
    updatedAt: Date.now(),
  } as Omit<PartnerType, "id">;
  // Use setDoc with merge to write nested objects safely (avoids updateDoc generic index signature constraints)
  await setDoc(ref, merged, { merge: true });
  invalidatePartnerListCaches();
  revalidatePartnersRoutes(merged.category);
  return true;
}

export async function deletePartner(id: string): Promise<boolean> {
  const existing = await getPartner(id);
  if (!existing) return false;
  await deleteDoc(doc(database, PARTNERS_COLLECTION, id));
  invalidatePartnerListCaches();
  revalidatePartnersRoutes(existing.category);
  return true;
}

// =====================
// Listing & Filtering
// =====================
export async function listPartners(): Promise<(PartnerType & { id: string })[]> {
  const key = CACHE_KEYS.PARTNERS_ALL;
  const fetcher = async () => {
    const col = collection(database, PARTNERS_COLLECTION);
    const qSnap = await getDocs(query(col, orderBy("priority", "asc")));
    return qSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PartnerType, "id">) }));
  };
  return cacheManager.getOrFetch(key, fetcher, CACHE_OPTIONS.PARTNERS);
}

export async function listPartnersByCategory(category: string): Promise<(PartnerType & { id: string })[]> {
  const all = await listPartners();
  return all.filter(p => (p.category || "") === category);
}

// =====================
// Stats & Events (unchanged logic, adapted field names preserved in documents)
// =====================
export type PartnerStats = {
  websiteClicks?: number;
  emailClicks?: number;
  phoneClicks?: number;
  views?: number;
};

// New: windowed stats (events collection) and interaction recorder
export interface PartnerStatsEventEntry {
  type: "website" | "email" | "phone" | "view";
  createdAt: number; // ms
}

export async function recordPartnerInteraction(partnerId: string, type: PartnerStatsEventEntry["type"], meta?: Record<string, unknown>) {
  const eventsCol = collection(database, PARTNERS_COLLECTION, partnerId, "events");
  const entry: PartnerEvent = {
    type: type === "website" ? "website_click" : type === "email" ? "email_click" : type === "phone" ? "phone_click" : "view",
    createdAt: Date.now(),
    ...(meta || {})
  } as PartnerEvent;
  await addDoc(eventsCol, entry);
  // also increment aggregate counter for quick overview
  const ref = doc(database, PARTNERS_COLLECTION, partnerId);
  const fieldMap: Record<string, string> = {
    website: "websiteClicks",
    email: "emailClicks",
    phone: "phoneClicks",
    view: "views",
  };
  const statField = fieldMap[type];
  if (statField) {
    await updateDoc(ref, { [statField]: increment(1), updatedAt: Date.now() });
  }
}

// =====================
// Legacy Compatibility Helpers (used by older routes)
// =====================
export async function incrementPartnerClick(partnerId: string) {
  // Map to website interaction
  await recordPartnerInteraction(partnerId, "website");
}

export async function incrementPartnerStat(partnerId: string, field: 'websiteClicks' | 'emailClicks' | 'phoneClicks' | 'views') {
  const mapping: Record<string, PartnerStatsEventEntry['type']> = {
    websiteClicks: 'website',
    emailClicks: 'email',
    phoneClicks: 'phone',
    views: 'view'
  };
  const type = mapping[field];
  if (type) await recordPartnerInteraction(partnerId, type);
}

export async function addPartnerEvent(partnerId: string, evt: { type: 'website_click' | 'email_click' | 'phone_click' | 'view'; createdAt?: number; target?: string }) {
  // Accept already normalized legacy event type naming
  let mapped: PartnerStatsEventEntry['type'];
  if (evt.type === 'website_click') mapped = 'website';
  else if (evt.type === 'email_click') mapped = 'email';
  else if (evt.type === 'phone_click') mapped = 'phone';
  else mapped = 'view';
  await recordPartnerInteraction(partnerId, mapped, evt.target ? { target: evt.target } : undefined);
}

export interface WindowedPartnerStatsResult {
  from: number;
  to: number;
  buckets: Array<{
    day: string; // YYYY-MM-DD
    website: number;
    email: number;
    phone: number;
    view: number;
  }>;
  totals: { website: number; email: number; phone: number; view: number };
}

export async function listPartnerStatsWindow(partnerId: string, days: number = 28): Promise<WindowedPartnerStatsResult> {
  const to = Date.now();
  const from = to - days * 86400000;
  const eventsCol = collection(database, PARTNERS_COLLECTION, partnerId, "events");
  const qEvt = query(eventsCol, where("createdAt", ">=", from), orderBy("createdAt", "asc"));
  const snap = await getDocs(qEvt);
  const bucketsMap = new Map<string, { website: number; email: number; phone: number; view: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(from + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    bucketsMap.set(key, { website: 0, email: 0, phone: 0, view: 0 });
  }
  snap.docs.forEach(d => {
    const ev = d.data() as PartnerEvent;
    const dayKey = new Date(ev.createdAt).toISOString().slice(0, 10);
    const bucket = bucketsMap.get(dayKey);
    if (!bucket) return; // outside prepared window (shouldn't happen)
    if (ev.type === 'website_click') bucket.website++;
    else if (ev.type === 'email_click') bucket.email++;
    else if (ev.type === 'phone_click') bucket.phone++;
    else if (ev.type === 'view') bucket.view++;
  });
  const buckets = Array.from(bucketsMap.entries()).map(([day, v]) => ({ day, ...v }));
  const totals = buckets.reduce((acc, b) => ({
    website: acc.website + b.website,
    email: acc.email + b.email,
    phone: acc.phone + b.phone,
    view: acc.view + b.view,
  }), { website: 0, email: 0, phone: 0, view: 0 });
  return { from, to, buckets, totals };
}

// =====================
// Form helper (legacy admin form mapping flat fields)
// =====================
export async function updatePartnerFromForm(partnerId: string, formData: FormData): Promise<void> {
  const name = (formData.get("name") as string) || undefined;
  const logo = (formData.get("logo") as string) || undefined;
  const category = (formData.get("category") as string) || undefined;
  const benefit = (formData.get("benefit") as string) || undefined; // maps to companyBenefits
  const website = (formData.get("link") as string) || undefined; // legacy field name
  const priorityRaw = formData.get("priority");
  const active = formData.get("active") !== null;
  const patch: UpdatePartnerInput = {};
  if (name) patch.company = { ...(patch.company || {}), name } as NonNullable<UpdatePartnerInput["company"]>;
  if (logo) patch.infos = { ...(patch.infos || {}), logoPath: logo } as NonNullable<UpdatePartnerInput["infos"]>;
  if (website) patch.infos = { ...(patch.infos || {}), website } as NonNullable<UpdatePartnerInput["infos"]>;
  if (benefit) patch.companyBenefits = benefit;
  if (category) patch.category = category;
  if (priorityRaw !== null) patch.priority = Number(priorityRaw);
  patch.active = active;
  await updatePartner(partnerId, patch);
}

// =====================
// Backwards compatibility profile-like helpers
// (Used by existing pages expecting separate profile docs)
// =====================
export interface PartnerProfileCompat {
  id: string;
  email: string;
  contactPerson: string;
  logo?: string;
  website?: string;
  phone?: string;
  images?: string[];
  texts?: string[];
}

export async function getPartnerProfile(id: string): Promise<PartnerProfileCompat | null> {
  const p = await getPartner(id);
  if (!p) return null;
  return {
    id: p.id,
    email: p.contact.email,
    contactPerson: p.contact.person,
    logo: p.infos.logoPath,
    website: p.infos.website,
    phone: p.contact.phone,
    images: (p as unknown as { images?: string[] }).images || [],
    texts: (p as unknown as { texts?: string[] }).texts || ["", "", ""],
  };
}

export async function updatePartnerProfile(id: string, patch: Partial<PartnerProfileCompat>): Promise<boolean> {
  const p = await getPartner(id);
  if (!p) return false;
  const upd: UpdatePartnerInput = {};
  if (patch.contactPerson || patch.email || patch.phone) {
    upd.contact = {
      person: patch.contactPerson ?? p.contact.person,
      email: patch.email ?? p.contact.email,
      phone: patch.phone ?? p.contact.phone,
    };
  }
  if (patch.logo || patch.website) {
    upd.infos = {
      website: patch.website ?? p.infos.website,
      logoPath: patch.logo ?? p.infos.logoPath,
    };
  }
  // Persist auxiliary arrays if present
  const ref = doc(database, PARTNERS_COLLECTION, id);
  const extra: Record<string, unknown> = {};
  if (patch.images) extra.images = patch.images;
  if (patch.texts) extra.texts = patch.texts;
  await updatePartner(id, upd);
  if (Object.keys(extra).length) {
    await updateDoc(ref, extra);
  }
  revalidatePartnersRoutes(p.category);
  return true;
}

export async function ensureProfileForCatalogPartner(partnerId: string): Promise<string> {
  // In the new unified schema the partner doc itself acts as both catalog + profile
  const p = await getPartner(partnerId);
  if (!p) throw new Error("Partner nicht gefunden");
  return partnerId;
}

export async function findCatalogByProfileId(profileId: string) {
  // Unified: profileId === partnerId
  return getPartner(profileId);
}

// Owner linkage removed in new schema; kept for compatibility (always null)
export async function findCatalogPartnerByOwnerId(): Promise<null> { return null; }

// =====================
// Cache / Revalidation helpers
// =====================
function invalidatePartnerListCaches() {
  cacheManager.delete(CACHE_KEYS.PARTNERS_ALL);
}

function revalidatePartnersRoutes(category?: string) {
  try {
    revalidatePath("/partners");
    if (category) {
      revalidatePath(`/partners/${category}`);
    }
    revalidatePath("/partner");
    revalidatePath("/sitemaps/partners/sitemap.xml");
  } catch {/* noop */}
}
