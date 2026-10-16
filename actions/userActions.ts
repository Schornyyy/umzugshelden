"use server";

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import type { User } from "@/types/UserType";
import { redirect } from "next/navigation";

const USERS_COLLECTION = "users_umzugshelden";

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
		.limit(1)
		.get();
	const first = snaps.docs[0];
	if (!first) return null;
	return { ...(first.data() as User), id: first.id };
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
