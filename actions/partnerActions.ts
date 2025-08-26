"use server";
import { database } from '@/config/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy, increment, limit } from 'firebase/firestore';
import { PartnerType } from '@/types/PartnerType';
import { PartnerEvent } from '@/types/PartnerEvent';

const PARTNERS_COLLECTION = 'partners';

function sanitize(input: string) {
  return input.trim();
}

export async function listPartners(): Promise<PartnerType[]> {
  const col = collection(database, PARTNERS_COLLECTION);
  const q = query(col, orderBy('priority', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PartnerType,'id'>) }));
}

export async function createPartner(data: Omit<PartnerType,'id'|'createdAt'|'updatedAt'>): Promise<PartnerType> {
  if (!data.name) throw new Error('Name erforderlich');
  const col = collection(database, PARTNERS_COLLECTION);
  const docRef = await addDoc(col, {
    ...data,
    name: sanitize(data.name),
    benefit: sanitize(data.benefit),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    priority: data.priority ?? 100,
  clicks: 0,
  });
  return { id: docRef.id, ...data } as PartnerType;
}

export async function updatePartner(id: string, patch: Partial<PartnerType>): Promise<boolean> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Partner nicht gefunden');
  await updateDoc(ref, { ...patch, updatedAt: Date.now() });
  return true;
}

export async function removePartner(id: string): Promise<boolean> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  await deleteDoc(ref);
  return true;
}

export async function getPartner(id: string): Promise<PartnerType | null> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<PartnerType,'id'>) };
}

export async function incrementPartnerClick(id: string): Promise<boolean> {
  const ref = doc(database, PARTNERS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  await updateDoc(ref, { clicks: increment(1), updatedAt: Date.now() });
  return true;
}

export async function listPartnerEvents(partnerId: string, take: number = 25): Promise<PartnerEvent[]> {
  const eventsCol = collection(database, PARTNERS_COLLECTION, partnerId, 'events');
  const q = query(eventsCol, orderBy('createdAt', 'desc'), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PartnerEvent,'id'>) }));
}

export async function updatePartnerFromForm(partnerId: string, formData: FormData) {
  const patch: Partial<PartnerType> = {
    name: formData.get('name')?.toString(),
    benefit: formData.get('benefit')?.toString(),
    logo: formData.get('logo')?.toString(),
    link: formData.get('link')?.toString() || undefined,
    category: formData.get('category')?.toString() || undefined,
    priority: formData.get('priority') ? Number(formData.get('priority')) : undefined,
    description: formData.get('description')?.toString() || undefined,
    active: formData.get('active') === 'on'
  };
  await updatePartner(partnerId, patch);
  return { success: true };
}