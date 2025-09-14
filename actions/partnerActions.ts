"use server";

import { database } from "@/config/firebase";
import { addDoc, collection, getDocs, query, updateDoc, where, doc, getDoc } from "firebase/firestore";

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