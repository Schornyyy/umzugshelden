"use server";

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { User } from "@/types/UserType";
import { redirect } from "next/navigation";

const USERS_COLLECTION = "users_umzugshelden";
const CRM_CUSTOMERS_COLLECTION = "crm_customers_umzugshelden";
const CRM_INVOICES_COLLECTION = "crm_invoices_umzugshelden";
const CRM_HANDOVER_COLLECTION = "crm_handover_protocols_umzugshelden";
const OFFER_COLLECTION = "offer_calculators_umzugshelden";

async function getCrmDataScore(ownerId: string): Promise<number> {
	const database = getAdminDatabase();
	const [customers, invoices, handovers, offers] = await Promise.all([
		database
			.collection(CRM_CUSTOMERS_COLLECTION)
			.where("ownerId", "==", ownerId)
			.count()
			.get(),
		database
			.collection(CRM_INVOICES_COLLECTION)
			.where("ownerId", "==", ownerId)
			.count()
			.get(),
		database
			.collection(CRM_HANDOVER_COLLECTION)
			.where("ownerId", "==", ownerId)
			.count()
			.get(),
		database.collection(OFFER_COLLECTION).doc(ownerId).get(),
	]);
	const savedCalculations = offers.data()?.savedCalculations;

	return (
		customers.data().count +
		invoices.data().count +
		handovers.data().count +
		(Array.isArray(savedCalculations) ? savedCalculations.length : 0)
	);
}

/**
 * Create a new user in Firestore.
 * Returns the new document id.
 */
export async function createUser(user: User): Promise<string> {
	if (!user?.email) throw new Error("User must have an email");
	const ref = await getAdminDatabase().collection(USERS_COLLECTION).add(user);
	return ref.id;
}

/**
 * Get a user by Firestore document id.
 */
export async function getUserById(id: string): Promise<(User & { id: string }) | null> {
	if (!id) return null;
	const snap = await getAdminDatabase().collection(USERS_COLLECTION).doc(id).get();
	if (!snap.exists) return null;
	return { ...(snap.data() as User), id: snap.id };
}

/**
 * Query user by email. Returns the first match or null.
 */
export async function getUserByEmail(email: string): Promise<(User & { id: string }) | null> {
	if (!email) return null;
	const snaps = await getAdminDatabase()
		.collection(USERS_COLLECTION)
		.where("email", "==", email)
		.get();
	if (snaps.empty) return null;
	if (snaps.size === 1) {
		const account = snaps.docs[0];
		return { ...(account.data() as User), id: account.id };
	}

	const scoredAccounts = await Promise.all(
		snaps.docs.map(async (account) => ({
			account,
			score: await getCrmDataScore(account.id),
		}))
	);
	scoredAccounts.sort((left, right) => right.score - left.score);
	const selected = scoredAccounts[0].account;
	return { ...(selected.data() as User), id: selected.id };
}

/**
 * Update user fields by id. Partial updates allowed.
 */
export async function updateUser(id: string, updates: Partial<User>): Promise<void> {
	if (!id) throw new Error("Missing user id");
	await getAdminDatabase()
		.collection(USERS_COLLECTION)
		.doc(id)
		.set(updates, { merge: true });
}

/**
 * Delete a user by id.
 */
export async function deleteUser(id: string): Promise<void> {
	if (!id) throw new Error("Missing user id");
	await getAdminDatabase().collection(USERS_COLLECTION).doc(id).delete();
}

/**
 * List all users (simple helper).
 */
export async function listUsers(): Promise<Array<User & { id: string }>> {
	const snaps = await getAdminDatabase().collection(USERS_COLLECTION).get();
	return snaps.docs.map((d) => ({ ...(d.data() as User), id: d.id }));
}

/**
 * Upsert user by email: if a user with the email exists, update it, otherwise create a new one.
 * Returns the user id.
 */
export async function upsertUserByEmail(user: User): Promise<string> {
	if (!user?.email) throw new Error("User must have an email");
	const existing = await getUserByEmail(user.email);
	if (existing) {
		await updateUser(existing.id, user);
		return existing.id;
	}
	return await createUser(user);
}


export async function navigateUser(user: User, path: string) {
    redirect(`/${user.role}/${user.id}/${path}`);
}

export async function redirectUser(path: string) {
    redirect(path);
}
