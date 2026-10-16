"use server";

import { createCustomerNumber } from "@/lib/crmIdentifiers";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { CrmCustomer } from "@/types/Crm";
import { Request, RequestNotice } from "@/types/Request";

const REQUEST_COLLECTION = "requests_umzugshelden";
const CRM_COLLECTION = "crm_customers_umzugshelden";

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
	const createdAt = Date.now();
	const requestId = crypto.randomUUID();

	const request: Request = {
		id: requestId,
		ownerId,
		name: data.name,
		email: data.email,
		phone: data.phone,
		message: data.message,
		imageUrls: data.imageUrls ?? [],
		createdAt,
		notices: [],
	};
	const imageDetails = request.imageUrls.length
		? `\n\nAnhänge:\n${request.imageUrls.join("\n")}`
		: "";
	const customer: CrmCustomer = {
		id: requestId,
		ownerId,
		customerNumber: createCustomerNumber(requestId, createdAt),
		name: data.name.trim(),
		company: "",
		email: data.email.trim(),
		phone: data.phone.trim(),
		street: "",
		postalCode: "",
		city: "",
		status: "lead",
		source: "Website-Anfrage",
		tags: ["Website-Anfrage"],
		notes: [
			{
				id: crypto.randomUUID(),
				text: `${data.message.trim()}${imageDetails}`,
				createdAt,
			},
		],
		appointments: [],
		orders: [],
		createdAt,
		updatedAt: createdAt,
	};

	const database = getAdminDatabase();
	const batch = database.batch();
	batch.set(database.collection(REQUEST_COLLECTION).doc(request.id), request);
	batch.set(database.collection(CRM_COLLECTION).doc(customer.id), customer);
	await batch.commit();
	return request;
}

// Get a single request by id ensuring ownerId matches
export async function getRequestById(
	requestId: string,
	ownerId: string
): Promise<Request | null> {
	const document = await getAdminDatabase()
		.collection(REQUEST_COLLECTION)
		.doc(requestId)
		.get();
	if (!document.exists) return null;
	const request = document.data() as Request;
	return request.ownerId === ownerId ? request : null;
}

// List all requests for an owner
export async function listRequestsByOwner(ownerId: string): Promise<Request[]> {
	const docsRef = await getAdminDatabase()
		.collection(REQUEST_COLLECTION)
		.where("ownerId", "==", ownerId)
		.get();
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

	await getAdminDatabase()
		.collection(REQUEST_COLLECTION)
		.doc(requestId)
		.update({ ...updated });
	return updated;
}

// Delete a request with owner validation
export async function deleteRequest(
	requestId: string,
	ownerId: string
): Promise<{ id: string } | null> {
	const existing = await getRequestById(requestId, ownerId);
	if (!existing) return null;
	await getAdminDatabase().collection(REQUEST_COLLECTION).doc(requestId).delete();
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

	await getAdminDatabase()
		.collection(REQUEST_COLLECTION)
		.doc(requestId)
		.update({ notices: updated.notices });
	return updated;
}
