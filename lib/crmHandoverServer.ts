import "server-only";

import {
  HANDOVER_ACCESS_COLLECTION,
  HANDOVER_PROTOCOL_COLLECTION,
  type CrmHandoverAccessRecord,
  parseHandoverAccessToken,
  tokenHashesMatch,
} from "@/lib/crmHandoverAccess";
import { getAdminAuth, getAdminDatabase } from "@/lib/firebaseAdmin";
import type { CrmHandoverProtocol } from "@/types/Crm";

const USER_COLLECTION = "users_umzugshelden";

export class HandoverRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedDeep(item)) as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, removeUndefinedDeep(item)])
    ) as T;
  }
  return value;
}

export async function requireCrmOwner(request: Request, ownerId: string) {
  const idToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!idToken) {
    throw new HandoverRequestError("Nicht autorisiert.", 401);
  }

  const decodedToken = await getAdminAuth()
    .verifyIdToken(idToken)
    .catch(() => null);
  const authenticatedEmail = decodedToken?.email?.trim().toLocaleLowerCase("de-DE");
  if (!authenticatedEmail) {
    throw new HandoverRequestError("Nicht autorisiert.", 401);
  }

  const ownerSnapshot = await getAdminDatabase()
    .collection(USER_COLLECTION)
    .doc(ownerId)
    .get();
  const ownerEmail = String(ownerSnapshot.data()?.email ?? "")
    .trim()
    .toLocaleLowerCase("de-DE");
  if (!ownerSnapshot.exists || ownerEmail !== authenticatedEmail) {
    throw new HandoverRequestError("Kein Zugriff auf diese CRM-Daten.", 403);
  }
}

export async function resolveHandoverAccess(token: string) {
  const parsedToken = parseHandoverAccessToken(token);
  if (!parsedToken) {
    throw new HandoverRequestError("Der Zugriffslink ist ungültig.", 404);
  }

  const database = getAdminDatabase();
  const accessSnapshot = await database
    .collection(HANDOVER_ACCESS_COLLECTION)
    .doc(parsedToken.protocolId)
    .get();
  if (!accessSnapshot.exists) {
    throw new HandoverRequestError("Der Zugriffslink ist ungültig.", 404);
  }

  const access = accessSnapshot.data() as CrmHandoverAccessRecord;
  if (
    access.protocolId !== parsedToken.protocolId ||
    !tokenHashesMatch(access.tokenHash, parsedToken.tokenHash)
  ) {
    throw new HandoverRequestError("Der Zugriffslink ist ungültig.", 404);
  }
  if (access.expiresAt <= Date.now()) {
    throw new HandoverRequestError(
      "Dieser Zugriffslink ist abgelaufen. Bitte fordern Sie einen neuen Link an.",
      410
    );
  }

  const protocolSnapshot = await database
    .collection(HANDOVER_PROTOCOL_COLLECTION)
    .doc(parsedToken.protocolId)
    .get();
  if (!protocolSnapshot.exists) {
    throw new HandoverRequestError("Das Übergabeprotokoll wurde nicht gefunden.", 404);
  }

  const protocol = protocolSnapshot.data() as CrmHandoverProtocol;
  if (protocol.ownerId !== access.ownerId || protocol.id !== access.protocolId) {
    throw new HandoverRequestError("Der Zugriffslink ist ungültig.", 404);
  }

  return { access, protocol, parsedToken };
}

export function publicProtocol(protocol: CrmHandoverProtocol) {
  return Object.fromEntries(
    Object.entries(protocol).filter(
      ([key]) => key !== "ownerId" && key !== "customerAccess"
    )
  ) as Omit<CrmHandoverProtocol, "ownerId" | "customerAccess">;
}

export function handoverErrorResponse(error: unknown) {
  if (error instanceof HandoverRequestError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Fehler im öffentlichen Übergabeprotokoll:", error);
  return Response.json(
    { error: "Das Übergabeprotokoll konnte nicht verarbeitet werden." },
    { status: 500 }
  );
}