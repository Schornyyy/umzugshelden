"use server";

import { database } from "@/config/firebase";
import type { Reference } from "@/types/ReferencType";
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
} from "firebase/firestore";

const REFERENCES_COLLECTION = "references";

// Simple in-memory caches (server process memory). Keys/entries expire after TTL.
const CACHE_TTL_MS = 60_000; // 60s default TTL
type CacheEntry<T> = { value: T; expires: number };
const refByIdCache = new Map<string, CacheEntry<Reference & { id: string }>>();
const publishedListCache = new Map<string, CacheEntry<Array<Reference & { id: string }>>>();

export async function clearReferenceCache(id?: string) {
	if (id) {
		refByIdCache.delete(id);
	} else {
		refByIdCache.clear();
	}
}

export async function clearPublishedReferencesCache() {
	publishedListCache.clear();
}

export async function clearAllReferenceCaches() {
	refByIdCache.clear();
	publishedListCache.clear();
}

export async function createReference(ref: Omit<Reference, 'id'>): Promise<string> {
	if (!ref?.comanyName) throw new Error("Reference must have a company name");
	const col = collection(database, REFERENCES_COLLECTION);
	const res = await addDoc(col, ref as Record<string, unknown>);
	// new document created -> invalidate published list cache
	clearPublishedReferencesCache();
	return res.id;
}

export async function getReferenceById(id: string): Promise<(Reference & { id: string }) | null> {
	if (!id) return null;
	// check cache
	const cached = refByIdCache.get(id);
	if (cached && cached.expires > Date.now()) return cached.value;

	const refDoc = doc(database, REFERENCES_COLLECTION, id);
	const snap = await getDoc(refDoc);
	if (!snap.exists()) return null;
	const val = { ...(snap.data() as Reference), id: snap.id };
	refByIdCache.set(id, { value: val, expires: Date.now() + CACHE_TTL_MS });
	return val;
}

export async function listReferences(): Promise<Array<Reference & { id: string }>> {
	const col = collection(database, REFERENCES_COLLECTION);
	const snaps = await getDocs(col);
	return snaps.docs.map((d) => ({ ...(d.data() as Reference), id: d.id }));
}

export async function listPublishedReferences(max?: number): Promise<Array<Reference & { id: string }>> {
	const key = `published:${max ?? 'all'}`;
	const cached = publishedListCache.get(key);
	if (cached && cached.expires > Date.now()) return cached.value;

	const col = collection(database, REFERENCES_COLLECTION);
	const q = query(col, where("public", "==", true));
	const snaps = await getDocs(q);
	const list = snaps.docs.map((d) => ({ ...(d.data() as Reference), id: d.id })).slice(0, max ? max : 1000);
	publishedListCache.set(key, { value: list, expires: Date.now() + CACHE_TTL_MS });
	return list;
}

export async function getReferencesByBranch(branch: string): Promise<Array<Reference & { id: string }>> {
	if (!branch) return [];
	const col = collection(database, REFERENCES_COLLECTION);
	const q = query(col, where("companyBranch", "==", branch));
	const snaps = await getDocs(q);
	return snaps.docs.map((d) => ({ ...(d.data() as Reference), id: d.id }));
}

export async function updateReference(id: string, updates: Partial<Reference>): Promise<void> {
 if (!id) throw new Error("Missing reference id");
 const refDoc = doc(database, REFERENCES_COLLECTION, id);
 await updateDoc(refDoc, updates as Record<string, unknown>);
 // invalidate caches
 clearReferenceCache(id);
 clearPublishedReferencesCache();
}

export async function deleteReference(id: string): Promise<void> {
 if (!id) throw new Error("Missing reference id");
 const refDoc = doc(database, REFERENCES_COLLECTION, id);
 await deleteDoc(refDoc);
 // invalidate caches
 clearReferenceCache(id);
 clearPublishedReferencesCache();
}

/**
 * Upsert by company name (simple heuristic): if a reference with the same company name exists, update it.
 * Returns the document id.
 */
export async function upsertReferenceByCompany(ref: Omit<Reference, 'id'>): Promise<string> {
	if (!ref?.comanyName) throw new Error("Reference must have a company name");
	const col = collection(database, REFERENCES_COLLECTION);
	const q = query(col, where("comanyName", "==", ref.comanyName));
	const snaps = await getDocs(q);
	const first = snaps.docs[0];
	if (first) {
	 await updateDoc(doc(database, REFERENCES_COLLECTION, first.id), ref as Record<string, unknown>);
	 // invalidate
	 clearReferenceCache(first.id);
	 clearPublishedReferencesCache();
	 return first.id;
	}
 	const created = await addDoc(col, ref as Record<string, unknown>);
 	// invalidate published list cache
 	clearPublishedReferencesCache();
 	return created.id;
}

