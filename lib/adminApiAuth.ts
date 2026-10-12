import "server-only";

import { getAdminAuth, getAdminDatabase } from "@/lib/firebaseAdmin";

const USER_COLLECTION = "users_umzugshelden";

export async function authorizeAdminOwner(
  request: Request,
  ownerId: string,
): Promise<boolean> {
  const configuredOwnerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId || (configuredOwnerId && ownerId !== configuredOwnerId)) {
    console.warn("Admin API authorization failed: owner mismatch");
    return false;
  }

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) {
    console.warn("Admin API authorization failed: token missing");
    return false;
  }

  const decoded = await getAdminAuth().verifyIdToken(token).catch(() => null);
  const tokenEmail = decoded?.email?.trim();
  const authenticatedEmail = tokenEmail?.toLocaleLowerCase("de-DE");
  if (!tokenEmail || !authenticatedEmail) {
    console.warn("Admin API authorization failed: invalid token");
    return false;
  }

  const database = getAdminDatabase();
  const accountQuery = await database
    .collection(USER_COLLECTION)
    .where("email", "==", tokenEmail)
    .limit(1)
    .get();
  const account = accountQuery.docs[0];
  if (account) {
    const isAdmin = String(account.get("role") ?? "").toLocaleLowerCase("de-DE") === "admin";
    const canAccessOwner = configuredOwnerId
      ? ownerId === configuredOwnerId
      : ownerId === account.id;
    if (isAdmin && canAccessOwner) return true;
    console.warn("Admin API authorization failed: insufficient account access");
    return false;
  }

  const ownerSnapshot = await database.collection(USER_COLLECTION).doc(ownerId).get();
  const ownerEmail = String(ownerSnapshot.get("email") ?? "")
    .trim()
    .toLocaleLowerCase("de-DE");
  const ownerRole = String(ownerSnapshot.get("role") ?? "").toLocaleLowerCase("de-DE");
  const authorized =
    ownerSnapshot.exists &&
    ownerEmail === authenticatedEmail &&
    ownerRole === "admin";
  if (!authorized) {
    console.warn("Admin API authorization failed: account not found");
  }
  return authorized;
}

export function authorizeCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("Cron authorization failed: CRON_SECRET is not configured");
    return false;
  }
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  return token === secret;
}

export async function authorizeAdminOwnerOrCron(
  request: Request,
  ownerId: string,
): Promise<boolean> {
  return (
    authorizeCronRequest(request) ||
    (await authorizeAdminOwner(request, ownerId))
  );
}
