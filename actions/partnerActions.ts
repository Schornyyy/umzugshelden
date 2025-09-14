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
  await updateDoc(ref, { ...patch, updatedAt: Date.now() });
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
  await updateDoc(ref, { ...patch, updatedAt: Date.now() });
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
  const docRef = await addDoc(col, {
    ...data,
    type: "catalog",
    clicks: data.clicks ?? 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updatePartner(id: string, patch: Partial<PartnerType>): Promise<void> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  await updateDoc(ref, { ...patch, updatedAt: Date.now(), type: "catalog" });
}

export async function removePartner(id: string): Promise<void> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  await deleteDoc(ref);
}