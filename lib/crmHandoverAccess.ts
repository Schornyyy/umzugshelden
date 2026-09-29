import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const HANDOVER_PROTOCOL_COLLECTION =
  "crm_handover_protocols_umzugshelden";
export const HANDOVER_ACCESS_COLLECTION =
  "crm_handover_protocol_access_umzugshelden";
export const HANDOVER_ACCESS_DURATION_MS = 48 * 60 * 60 * 1000;

export type CrmHandoverAccessRecord = {
  protocolId: string;
  ownerId: string;
  tokenHash: string;
  email: string;
  sentAt: number;
  expiresAt: number;
  completedAt?: number;
  downloadedAt?: number;
  emailSentAt?: number;
};

function hashTokenSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function createHandoverAccessToken(protocolId: string) {
  const secret = randomBytes(32).toString("base64url");
  return {
    token: `${protocolId}.${secret}`,
    tokenHash: hashTokenSecret(secret),
  };
}

export function parseHandoverAccessToken(token: string) {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const protocolId = token.slice(0, separatorIndex);
  const secret = token.slice(separatorIndex + 1);
  if (
    !/^[a-z0-9_-]{6,128}$/i.test(protocolId) ||
    !/^[a-z0-9_-]{40,64}$/i.test(secret)
  ) {
    return null;
  }

  return { protocolId, tokenHash: hashTokenSecret(secret) };
}

export function tokenHashesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return (
    leftBuffer.length === rightBuffer.length &&
    leftBuffer.length > 0 &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}