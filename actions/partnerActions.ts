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
import { z } from "zod";

export interface PartnerProfile {
  ownerid: string; // Account ID
  email: string;
  contactPerson: string;
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