"use server";

import { database } from "@/config/firebase";
import { Request, RequestNotice } from "@/types/Request";
import {
	and,
	collection,
	deleteDoc,
	doc,
	getDocs,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";

const REQUEST_COLLECTION = "requests_umzugshelden";

// Create a new request scoped to an owner
export async function createRequest(
	ownerId: string,
	data: {
		name: string;
		email: string;
		phone: string;
		message: string;
		imageUrls?: string[];
	}
): Promise<Request> {
	const colRef = collection(database, REQUEST_COLLECTION);

	const request: Request = {
		id: crypto.randomUUID(),
		ownerId,
		name: data.name,
		email: data.email,
		phone: data.phone,
		message: data.message,
		imageUrls: data.imageUrls ?? [],
		createdAt: Date.now(),
		notices: [],
	};

	await setDoc(doc(colRef, request.id), request);
	return request;
}

// Get a single request by id ensuring ownerId matches
export async function getRequestById(
	requestId: string,
	ownerId: string
): Promise<Request | null> {
	const colRef = collection(database, REQUEST_COLLECTION);
	const qRef = query(
		colRef,
		and(where("id", "==", requestId), where("ownerId", "==", ownerId))
	);
	const docsRef = await getDocs(qRef);
	if (docsRef.docs.length === 0) return null;
	return docsRef.docs[0].data() as Request;
}

// List all requests for an owner
export async function listRequestsByOwner(ownerId: string): Promise<Request[]> {
	const colRef = collection(database, REQUEST_COLLECTION);
	const qRef = query(colRef, where("ownerId", "==", ownerId));
	const docsRef = await getDocs(qRef);
	if (docsRef.empty) return [];
	return docsRef.docs.map((d) => d.data() as Request);
}

// Update a request ensuring the ownerId matches the existing record
export async function updateRequest(
	requestId: string,
	ownerId: string,
	patch: Partial<Pick<Request, "name" | "email" | "phone" | "message" | "imageUrls" | "notices">>
): Promise<Request | null> {
	const existing = await getRequestById(requestId, ownerId);
	if (!existing) return null; // not found or owner mismatch

	const updated: Request = {
		...existing,
		name: patch.name ?? existing.name,
		email: patch.email ?? existing.email,
		phone: patch.phone ?? existing.phone,
		message: patch.message ?? existing.message,
		imageUrls: patch.imageUrls ?? existing.imageUrls ?? [],
		notices: patch.notices ?? existing.notices,
	};

	const colRef = collection(database, REQUEST_COLLECTION);
	const docRef = doc(colRef, requestId);
	await updateDoc(docRef, { ...updated });
	return updated;
}

// Delete a request with owner validation
export async function deleteRequest(
	requestId: string,
	ownerId: string
): Promise<{ id: string } | null> {
	const existing = await getRequestById(requestId, ownerId);
	if (!existing) return null;
	const colRef = collection(database, REQUEST_COLLECTION);
	const docRef = doc(colRef, requestId);
	await deleteDoc(docRef);
	return { id: requestId };
}

// Append a notice to a request (owner validated)
export async function addRequestNotice(
	requestId: string,
	ownerId: string,
	notice: { titel: string; msg: string }
): Promise<Request | null> {
	const existing = await getRequestById(requestId, ownerId);
	if (!existing) return null;

	const newNotice: RequestNotice = {
		titel: notice.titel,
		msg: notice.msg,
		createdAt: Date.now(),
	};

	const updated: Request = {
		...existing,
		notices: [...existing.notices, newNotice],
	};

	const colRef = collection(database, REQUEST_COLLECTION);
	const docRef = doc(colRef, requestId);
	await updateDoc(docRef, { notices: updated.notices });
	return updated;
}

