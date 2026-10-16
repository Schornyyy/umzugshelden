"use server";

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { Reference } from "@/types/ReferencType";

const REFERENCES_COLLECTION = "references_umzugshelden";

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
	const res = await getAdminDatabase().collection(REFERENCES_COLLECTION).add(ref);
	// new document created -> invalidate published list cache
	clearPublishedReferencesCache();
	return res.id;
}

export async function getReferenceById(id: string): Promise<(Reference & { id: string }) | null> {
	if (!id) return null;
	// check cache
	const cached = refByIdCache.get(id);
	if (cached && cached.expires > Date.now()) return cached.value;

	const snap = await getAdminDatabase().collection(REFERENCES_COLLECTION).doc(id).get();
	if (!snap.exists) return null;
	const val = { ...(snap.data() as Reference), id: snap.id };
	refByIdCache.set(id, { value: val, expires: Date.now() + CACHE_TTL_MS });
	return val;
}

export async function listReferences(): Promise<Array<Reference & { id: string }>> {
	const snaps = await getAdminDatabase().collection(REFERENCES_COLLECTION).get();
	return snaps.docs.map((d) => ({ ...(d.data() as Reference), id: d.id }));
}

export async function listPublishedReferences(max?: number): Promise<Array<Reference & { id: string }>> {
	const key = `published:${max ?? 'all'}`;
	const cached = publishedListCache.get(key);
	if (cached && cached.expires > Date.now()) return cached.value;

	const snaps = await getAdminDatabase()
		.collection(REFERENCES_COLLECTION)
		.where("public", "==", true)
		.get();
	const list = snaps.docs.map((d) => ({ ...(d.data() as Reference), id: d.id })).slice(0, max ? max : 1000);
	publishedListCache.set(key, { value: list, expires: Date.now() + CACHE_TTL_MS });
	return list;
}

export async function getReferencesByBranch(branch: string): Promise<Array<Reference & { id: string }>> {
	if (!branch) return [];
	const snaps = await getAdminDatabase()
		.collection(REFERENCES_COLLECTION)
		.where("companyBranch", "==", branch)
		.get();
	return snaps.docs.map((d) => ({ ...(d.data() as Reference), id: d.id }));
}
export async function updateReference(id: string, updates: Partial<Reference>): Promise<void> {
 if (!id) throw new Error("Missing reference id");
 await getAdminDatabase().collection(REFERENCES_COLLECTION).doc(id).set(updates, { merge: true });
 // invalidate caches
 clearReferenceCache(id);
 clearPublishedReferencesCache();
}


export async function deleteReference(id: string): Promise<void> {
 if (!id) throw new Error("Missing reference id");
 await getAdminDatabase().collection(REFERENCES_COLLECTION).doc(id).delete();
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
	const collection = getAdminDatabase().collection(REFERENCES_COLLECTION);
	const snaps = await collection.where("comanyName", "==", ref.comanyName).get();
	if (snaps.docs.length > 0) {
	 await snaps.docs[0].ref.set(ref, { merge: true });
	 // invalidate
	 clearReferenceCache(snaps.docs[0].id);
	 clearPublishedReferencesCache();
	 return snaps.docs[0].id;
	}
	
	const created = await collection.add(ref);
 	// invalidate published list cache
 	clearPublishedReferencesCache();
 	return created.id;
}
